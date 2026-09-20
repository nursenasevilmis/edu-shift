// Haftalik saat sayisina gore mantikli blok kombinasyonlarini uretir.
// Kombinasyon patlamasini onlemek icin: en fazla 4 parcaya bolunur,
// ve en dengeli (parca sayisi az, boyutlar birbirine yakin) olanlar once gelir.
export function generateBlockPatterns(totalHours, maxBlockSize = 3, maxParts = 4) {
  const total = Number(totalHours)
  if (!total || total < 1) return []

  const results = []

  function helper(remaining, path) {
    if (path.length > maxParts) return
    if (remaining === 0) {
      results.push([...path])
      return
    }
    const maxAllowed = path.length === 0 ? maxBlockSize : path[path.length - 1]
    for (let part = Math.min(maxAllowed, remaining); part >= 1; part--) {
      path.push(part)
      helper(remaining - part, path)
      path.pop()
    }
  }

  helper(total, [])

  // En az parcali (en "buyuk bloklu") kombinasyonlar once gelsin, kucuk-buyuk siralamayla goster
  const sorted = results
    .map((r) => [...r].reverse())
    .sort((a, b) => a.length - b.length || Math.max(...b) - Math.max(...a))
    .slice(0, 6) // dropdown'da en fazla 6 secenek goster

  return sorted.map((r) => r.join('+'))
}