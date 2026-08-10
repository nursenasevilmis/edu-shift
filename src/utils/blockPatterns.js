// Haftalik saat sayisina gore mantikli blok kombinasyonlarini uretir.
// Her blok en fazla 3 saat olabilir (pedagojik olarak bir derste 3 saatten
// fazla kesintisiz blok olagan degil). Kombinasyonlar kucukten buyuge siralanir.
export function generateBlockPatterns(totalHours, maxBlockSize = 3) {
    const total = Number(totalHours)
    if (!total || total < 1) return []
  
    const results = []
  
    function helper(remaining, path) {
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
  
    // Buyukten kucuge uretildi (orn: 3,2), gosterim icin kucukten buyuge cevir (2+3)
    return results.map((r) => [...r].reverse().join('+'))
  }