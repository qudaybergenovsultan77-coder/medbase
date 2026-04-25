'use client'
import { MedFile, LANG_INFO, Lang } from '@/types'

interface Props {
  file: MedFile
  canFull: boolean
  onClose: () => void
  onBuy?: () => void
  onDownload?: () => void
}

export default function PreviewModal({ file, canFull, onClose, onBuy, onDownload }: Props) {
  const { flag, label } = LANG_INFO[file.lang as Lang] || { flag: '🌐', label: file.lang }
  const isBook = file.kind === 'darslik'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-5">
            <span className="text-2xl mt-0.5">{isBook ? '📘' : '📝'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-gray-900">{file.name}</div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-gray-400">{file.subject} · {file.year}</span>
                <span className={`badge-${file.lang}`}>{flag} {label}</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          {isBook ? (
            <div className="bg-gray-50 rounded-xl h-36 flex items-center justify-center relative overflow-hidden mb-4">
              <div className="w-20 h-28 bg-white border border-gray-200 rounded-lg p-2 flex flex-col gap-1.5 shadow-sm">
                {[100, 70, 85, 55, 75, 60, 90, 50].map((w, i) => (
                  <div key={i} className="h-1.5 bg-gray-200 rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
              {!canFull && (
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 flex items-end justify-center pb-3">
                  <span className="text-xs text-gray-400">🔒 Faqat 1-bet ko'rinmoqda</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 relative overflow-hidden min-h-28">
              <div className="text-sm font-medium text-gray-900 mb-2">
                1. {file.subject} bo'yicha qaysi javob to'g'ri?
              </div>
              {['A) Birinchi variant', 'B) Ikkinchi variant', 'C) Uchinchi variant'].map(opt => (
                <div key={opt} className="flex items-center gap-2 text-xs text-gray-500 py-1">
                  <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" />
                  {opt}
                </div>
              ))}
              {!canFull && (
                <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-gray-50 flex items-end justify-center pb-2">
                  <span className="text-xs text-gray-400">🔒 Faqat 1-savol ko'rinmoqda</span>
                </div>
              )}
            </div>
          )}

          {file.description && <p className="text-sm text-gray-500 mb-4">{file.description}</p>}

          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {file.isPaid
              ? <span className="text-lg font-semibold text-emerald-700">{file.price.toLocaleString()} so'm</span>
              : <span className="badge-free text-sm">Bepul</span>
            }
            {file.fileSize && <span className="text-xs text-gray-400">{file.fileSize}</span>}
            {file.kind === 'test' && file.qCount && (
              <span className="text-xs text-gray-400">{file.qCount} ta savol</span>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 btn-secondary py-2.5">Yopish</button>
            {canFull ? (
              <button onClick={onDownload} className="flex-1 btn-success py-2.5">Yuklab olish</button>
            ) : (
              <button onClick={onBuy} className="flex-1 btn-primary py-2.5">
                Sotib olish — {file.price.toLocaleString()} so'm
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
