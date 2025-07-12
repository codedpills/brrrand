import type { AssetExtractionResult } from './assetExtraction'

export const downloadAsset = async (url: string, filename: string) => {
  try {
    const response = await fetch(url, { mode: 'cors' })
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Download failed:', error)
    // Fallback: open in new tab
    window.open(url, '_blank')
  }
}

export const downloadAllAssets = async (extractionResult: AssetExtractionResult) => {
  if (!extractionResult?.assets) return

  const { logos, colors, fonts, illustrations } = extractionResult.assets
  const domain = extractionResult.domain || 'assets'

  // Create a text file with asset information
  let assetsText = `Brand Assets from ${domain}\n`
  assetsText += `Generated on ${new Date().toLocaleString()}\n\n`

  if (logos.length > 0) {
    assetsText += `LOGOS (${logos.length}):\n`
    logos.forEach((logo, index) => {
      assetsText += `${index + 1}. ${logo.alt || 'Logo'}: ${logo.url}\n`
    })
    assetsText += '\n'
  }

  if (colors.length > 0) {
    assetsText += `COLORS (${colors.length}):\n`
    colors.forEach((color, index) => {
      assetsText += `${index + 1}. ${color.value}\n`
    })
    assetsText += '\n'
  }

  if (fonts.length > 0) {
    assetsText += `FONTS (${fonts.length}):\n`
    fonts.forEach((font, index) => {
      assetsText += `${index + 1}. ${font.name}${font.url ? `\n   URL: ${font.url}` : ''}\n`
      // Add CSS import suggestion for Google Fonts
      if (font.url && font.url.includes('fonts.googleapis.com') && font.name) {
        const fontFamily = font.name.replace(/\s+/g, '+')
        assetsText += `   CSS Import: @import url('https://fonts.googleapis.com/css2?family=${fontFamily}&display=swap');\n`
      }
    })
    assetsText += '\n'
  }

  if (illustrations.length > 0) {
    assetsText += `ILLUSTRATIONS (${illustrations.length}):\n`
    illustrations.forEach((illustration, index) => {
      assetsText += `${index + 1}. ${illustration.alt || 'Illustration'}: ${illustration.url}\n`
    })
  }

  // Download the assets list as a text file
  const blob = new Blob([assetsText], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${domain}-brand-assets.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error('Copy to clipboard failed:', error)
  }
}

export const generateFontCSSImports = (fonts: any[]) => {
  const googleFonts = fonts.filter(font => 
    font.url && font.url.includes('fonts.googleapis.com') && font.name
  )
  
  if (googleFonts.length === 0) return ''
  
  // Generate CSS imports
  const imports = googleFonts.map(font => {
    const fontFamily = font.name.replace(/\s+/g, '+')
    return `@import url('https://fonts.googleapis.com/css2?family=${fontFamily}:wght@300;400;500;600;700&display=swap');`
  }).join('\n')
  
  const fontFamilies = googleFonts.map(font => `'${font.name}', sans-serif`).join(', ')
  
  return `/* CSS Font Imports */\n${imports}\n\n/* Font Family Usage */\nfont-family: ${fontFamilies};`
}
