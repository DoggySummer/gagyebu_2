import type { Database } from '../../../shared/database.types.js'
import type { InbodyRecordDto, InbodyRequest } from '../../../shared/api.types.js'
import type { UserClient } from '../../lib/supabase.js'

type InbodyRow = Database['public']['Tables']['inbody_records']['Row']

function toDto(row: InbodyRow): InbodyRecordDto {
  return {
    id: row.id,
    measuredAt: row.measured_at,
    weight: row.weight,
    skeletalMuscleMass: row.skeletal_muscle_mass,
    bodyFatMass: row.body_fat_mass,
    bodyFatPercentage: row.body_fat_percentage,
    waistHipRatio: row.waist_hip_ratio,
    visceralFatLevel: row.visceral_fat_level,
  }
}

/** 측정일 오름차순. 그래프가 왼쪽에서 오른쪽으로 흐르도록 정렬해서 준다. */
export async function listRecords(
  supabase: UserClient,
  userId: string,
): Promise<InbodyRecordDto[]> {
  const { data, error } = await supabase
    .from('inbody_records')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: true })

  if (error) throw error

  return data.map(toDto)
}

/**
 * 같은 측정일이면 덮어쓴다.
 * (user_id, measured_at) 유니크가 충돌 대상이라 잘못 입력한 기록은
 * 같은 날짜로 다시 저장하면 정정된다.
 */
export async function saveRecord(
  supabase: UserClient,
  userId: string,
  body: InbodyRequest,
): Promise<InbodyRecordDto> {
  const { data, error } = await supabase
    .from('inbody_records')
    .upsert(
      {
        user_id: userId,
        measured_at: body.measuredAt,
        weight: body.weight,
        skeletal_muscle_mass: body.skeletalMuscleMass,
        body_fat_mass: body.bodyFatMass,
        body_fat_percentage: body.bodyFatPercentage,
        waist_hip_ratio: body.waistHipRatio,
        visceral_fat_level: body.visceralFatLevel,
      },
      { onConflict: 'user_id,measured_at' },
    )
    .select()
    .single()

  if (error) throw error

  return toDto(data)
}
