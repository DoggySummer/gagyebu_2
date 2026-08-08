import { HTTPException } from 'hono/http-exception'
import type {
  WorkFlowDto,
  WorkScreenDetailDto,
  WorkScreenRequest,
  WorkScreenSummaryDto,
  WorkScreensResponse,
} from '../../../shared/api.types.js'
import type { UserClient } from '../../lib/supabase.js'
import type { WorkScreensCursor } from '../../lib/validate.js'

const PAGE_SIZE = 20

function toFlowDto(row: {
  id: string
  sort_order: number
  description: string
  is_done: boolean
  done_at: string | null
}): WorkFlowDto {
  return {
    id: row.id,
    sortOrder: row.sort_order,
    description: row.description,
    isDone: row.is_done,
    doneAt: row.done_at,
  }
}

/**
 * 마감임박순(sort_key = coalesce(deadline, 'infinity') ASC, id ASC) 20건 커서 페이지네이션.
 * sort_key가 NOT NULL이라 즐겨찾기와 달리 (sort_key, id) 두 컬럼짜리 seek 커서가 필요하다 —
 * 같은 마감일(또는 둘 다 마감일 없음)인 화면이 여럿일 수 있어 id로 타이브레이크한다.
 */
export async function listWorkScreens(
  supabase: UserClient,
  userId: string,
  cursor: WorkScreensCursor | null,
): Promise<WorkScreensResponse> {
  let query = supabase
    .from('work_screens')
    .select('id,title,summary,deadline')
    .eq('user_id', userId)
    .order('sort_key', { ascending: true })
    .order('id', { ascending: true })
    .limit(PAGE_SIZE + 1)

  if (cursor) {
    query = query.or(
      `sort_key.gt.${cursor.sortKey},and(sort_key.eq.${cursor.sortKey},id.gt.${cursor.id})`,
    )
  }

  const { data: screens, error } = await query

  if (error) throw error

  const hasMore = screens.length > PAGE_SIZE
  const page = hasMore ? screens.slice(0, PAGE_SIZE) : screens

  const flowCounts = await fetchFlowCounts(
    supabase,
    userId,
    page.map((screen) => screen.id),
  )

  const items: WorkScreenSummaryDto[] = page.map((screen) => {
    const counts = flowCounts.get(screen.id) ?? { total: 0, done: 0 }

    return {
      id: screen.id,
      title: screen.title,
      summary: screen.summary,
      deadline: screen.deadline,
      totalFlows: counts.total,
      doneFlows: counts.done,
    }
  })

  // sort_key = coalesce(deadline, 'infinity') 이므로 DB에서 다시 안 가져와도 deadline만으로
  // 그대로 재현할 수 있다. 다음 페이지 커서는 (sort_key, id) 쌍을 그대로 실어 보낸다.
  const lastRow = page[page.length - 1]
  const nextCursor = hasMore ? `${lastRow.deadline ?? 'infinity'}|${lastRow.id}` : null

  return { items, nextCursor }
}

async function fetchFlowCounts(
  supabase: UserClient,
  userId: string,
  screenIds: string[],
): Promise<Map<string, { total: number; done: number }>> {
  const counts = new Map<string, { total: number; done: number }>()

  if (screenIds.length === 0) return counts

  const { data, error } = await supabase
    .from('work_flows')
    .select('screen_id,is_done')
    .eq('user_id', userId)
    .in('screen_id', screenIds)

  if (error) throw error

  for (const row of data) {
    const entry = counts.get(row.screen_id) ?? { total: 0, done: 0 }
    entry.total += 1
    if (row.is_done) entry.done += 1
    counts.set(row.screen_id, entry)
  }

  return counts
}

export async function getWorkScreen(
  supabase: UserClient,
  userId: string,
  id: string,
): Promise<WorkScreenDetailDto> {
  const [screenResult, flowsResult] = await Promise.all([
    supabase.from('work_screens').select('*').eq('id', id).eq('user_id', userId).maybeSingle(),
    supabase
      .from('work_flows')
      .select('id,sort_order,description,is_done,done_at')
      .eq('screen_id', id)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
  ])

  if (screenResult.error) throw screenResult.error
  if (flowsResult.error) throw flowsResult.error

  if (!screenResult.data) {
    throw new HTTPException(404, { message: '작업을 찾을 수 없어요.' })
  }

  const screen = screenResult.data
  const flows = flowsResult.data.map(toFlowDto)

  return {
    id: screen.id,
    title: screen.title,
    summary: screen.summary,
    deadline: screen.deadline,
    totalFlows: flows.length,
    doneFlows: flows.filter((flow) => flow.isDone).length,
    unknownTerms: screen.unknown_terms,
    edgeCases: screen.edge_cases,
    createdAt: screen.created_at,
    updatedAt: screen.updated_at,
    flows,
  }
}

export async function createWorkScreen(
  supabase: UserClient,
  userId: string,
  body: WorkScreenRequest,
): Promise<WorkScreenDetailDto> {
  const { data: screen, error: screenError } = await supabase
    .from('work_screens')
    .insert({
      user_id: userId,
      title: body.title,
      summary: body.summary,
      unknown_terms: body.unknownTerms,
      edge_cases: body.edgeCases,
      deadline: body.deadline,
    })
    .select()
    .single()

  if (screenError) throw screenError

  if (body.flows.length > 0) {
    const { error: flowsError } = await supabase.from('work_flows').insert(
      body.flows.map((flow, index) => ({
        user_id: userId,
        screen_id: screen.id,
        sort_order: index,
        description: flow.description,
      })),
    )

    if (flowsError) throw flowsError
  }

  return getWorkScreen(supabase, userId, screen.id)
}

/**
 * 화면 본문을 갱신하고 흐름 목록을 제출된 배열과 맞춘다.
 * id가 있는 흐름은 설명·순서만 바꾸고 완료 상태(is_done/done_at)는 건드리지 않는다 —
 * 인풋 화면에는 완료 체크박스가 없으므로 여기서 조작할 일이 없다.
 * id가 없는 흐름은 새로 만들고, 제출되지 않은 기존 id는 삭제한다.
 */
export async function updateWorkScreen(
  supabase: UserClient,
  userId: string,
  id: string,
  body: WorkScreenRequest,
): Promise<WorkScreenDetailDto> {
  const { data: updated, error: updateError } = await supabase
    .from('work_screens')
    .update({
      title: body.title,
      summary: body.summary,
      unknown_terms: body.unknownTerms,
      edge_cases: body.edgeCases,
      deadline: body.deadline,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (updateError) throw updateError

  if (!updated) {
    throw new HTTPException(404, { message: '작업을 찾을 수 없어요.' })
  }

  const { data: existingFlows, error: existingError } = await supabase
    .from('work_flows')
    .select('id')
    .eq('screen_id', id)
    .eq('user_id', userId)

  if (existingError) throw existingError

  const existingIds = new Set(existingFlows.map((flow) => flow.id))
  const submittedIds = new Set<string>()

  for (const [index, flow] of body.flows.entries()) {
    if (flow.id && existingIds.has(flow.id)) {
      submittedIds.add(flow.id)

      const { error } = await supabase
        .from('work_flows')
        .update({ description: flow.description, sort_order: index })
        .eq('id', flow.id)
        .eq('user_id', userId)

      if (error) throw error
    } else {
      const { error } = await supabase.from('work_flows').insert({
        user_id: userId,
        screen_id: id,
        sort_order: index,
        description: flow.description,
      })

      if (error) throw error
    }
  }

  const removedIds = [...existingIds].filter((flowId) => !submittedIds.has(flowId))

  if (removedIds.length > 0) {
    const { error } = await supabase
      .from('work_flows')
      .delete()
      .eq('user_id', userId)
      .in('id', removedIds)

    if (error) throw error
  }

  return getWorkScreen(supabase, userId, id)
}

export async function deleteWorkScreen(
  supabase: UserClient,
  userId: string,
  id: string,
): Promise<void> {
  // work_flows 는 screen_id 에 on delete cascade 가 걸려 있어 함께 지워진다.
  const { error } = await supabase.from('work_screens').delete().eq('id', id).eq('user_id', userId)

  if (error) throw error
}

export async function setWorkFlowDone(
  supabase: UserClient,
  userId: string,
  flowId: string,
  isDone: boolean,
): Promise<WorkFlowDto> {
  const { data, error } = await supabase
    .from('work_flows')
    .update({ is_done: isDone, done_at: isDone ? new Date().toISOString() : null })
    .eq('id', flowId)
    .eq('user_id', userId)
    .select('id,sort_order,description,is_done,done_at')
    .maybeSingle()

  if (error) throw error

  if (!data) {
    throw new HTTPException(404, { message: '흐름을 찾을 수 없어요.' })
  }

  return toFlowDto(data)
}
