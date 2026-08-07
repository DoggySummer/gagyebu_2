import { useState } from 'react'
import { useNavigate } from 'react-router'
import { saveInbodyRecord } from '@/domains/inbody/api'
import { METRICS, SECTIONS, type MetricKey } from '@/domains/inbody/fields'
import { todayKey } from '@/lib/date'
import type { InbodyRequest } from '@shared/api.types'

type Values = Record<MetricKey, string>

const EMPTY_VALUES = Object.fromEntries(METRICS.map((metric) => [metric.key, ''])) as Values

export function InbodyFormPage() {
  const navigate = useNavigate()
  const [measuredAt, setMeasuredAt] = useState(todayKey())
  const [values, setValues] = useState<Values>(EMPTY_VALUES)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weight = Number(values.weight)
  const canSave = values.weight.trim() !== '' && Number.isFinite(weight) && weight > 0

  const close = () => void navigate('/stats/inbody')

  const handleSave = async () => {
    if (!canSave) return

    setIsSaving(true)
    setError(null)

    const numbers = {} as Record<MetricKey, number | null>

    for (const metric of METRICS) {
      const raw = values[metric.key].trim()
      const parsed = Number(raw)

      numbers[metric.key] = raw === '' || !Number.isFinite(parsed) ? null : parsed
    }

    const body: InbodyRequest = {
      measuredAt,
      weight: numbers.weight ?? 0,
      skeletalMuscleMass: numbers.skeletalMuscleMass,
      bodyFatMass: numbers.bodyFatMass,
      bodyFatPercentage: numbers.bodyFatPercentage,
      waistHipRatio: numbers.waistHipRatio,
      visceralFatLevel: numbers.visceralFatLevel,
    }

    try {
      await saveInbodyRecord(body)
      void navigate('/stats/inbody')
    } catch (caught) {
      // 저장에 실패해도 입력값은 화면에 그대로 둔다.
      setError(caught instanceof Error ? caught.message : '저장하지 못했어요.')
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto w-full max-w-[560px] px-4 pb-10">
        <div className="flex items-center justify-between py-3">
          <button
            type="button"
            aria-label="닫기"
            onClick={close}
            className="flex h-11 w-11 items-center justify-center text-content text-muted"
          >
            ✕
          </button>
          <h1 className="text-field font-semibold text-ink">인바디 기록 추가</h1>
          <button
            type="button"
            disabled={!canSave || isSaving}
            onClick={() => void handleSave()}
            className="flex h-11 min-w-11 items-center justify-center px-1 text-field font-semibold text-ink disabled:text-placeholder"
          >
            저장
          </button>
        </div>

        <div className="mt-2">
          <label htmlFor="measured-at" className="text-label font-semibold text-muted">
            측정 날짜
          </label>
          <input
            id="measured-at"
            type="date"
            value={measuredAt}
            max={todayKey()}
            onChange={(event) => setMeasuredAt(event.target.value)}
            className="mt-1.5 min-h-[44px] w-full rounded-card border border-hairline bg-surface px-3 text-field font-semibold text-ink"
          />
        </div>

        {SECTIONS.map((section) => (
          <section key={section} className="mt-6 border-t border-hairline pt-5">
            <h2 className="text-label font-semibold uppercase tracking-label text-muted">
              {section}
            </h2>

            <div className="mt-3 flex flex-col gap-4">
              {METRICS.filter((metric) => metric.section === section).map((metric) => (
                <div key={metric.key}>
                  <label htmlFor={metric.key} className="text-label font-semibold text-muted">
                    {metric.label}
                    {metric.required && <span className="ml-1 text-cat-food-fg">*</span>}
                  </label>
                  <div className="mt-1.5 flex min-h-[44px] items-center gap-2 rounded-card border border-hairline bg-surface px-3">
                    <input
                      id={metric.key}
                      type="text"
                      inputMode="decimal"
                      value={values[metric.key]}
                      placeholder={metric.decimals === 0 ? '0' : (0).toFixed(metric.decimals)}
                      onChange={(event) =>
                        setValues((prev) => ({ ...prev, [metric.key]: event.target.value }))
                      }
                      className="min-w-0 flex-1 bg-transparent py-2 text-field font-semibold text-ink outline-none placeholder:font-normal placeholder:text-placeholder"
                    />
                    <span className="shrink-0 text-content font-semibold text-muted">
                      {metric.inputUnit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {error && (
          <p role="alert" className="mt-4 text-content text-cat-food-fg">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!canSave || isSaving}
          onClick={() => void handleSave()}
          className="mt-6 min-h-[44px] w-full rounded-card bg-ink px-4 text-field font-semibold text-canvas disabled:bg-chip disabled:text-chip-fg"
        >
          {isSaving ? '저장 중…' : '저장'}
        </button>

        <p className="mt-3 text-center text-label text-muted">
          같은 측정 날짜로 저장하면 기존 기록을 덮어씁니다.
        </p>
      </div>
    </div>
  )
}
