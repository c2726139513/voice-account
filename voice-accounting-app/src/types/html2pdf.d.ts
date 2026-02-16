declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number[] | number
    filename?: string
    image?: {
      type?: 'jpeg' | 'png' | 'webp'
      quality?: number
    }
    html2canvas?: {
      scale?: number
      useCORS?: boolean
      logging?: boolean
      letterRendering?: boolean
      proxy?: string
    }
    jsPDF?: {
      unit?: 'pt' | 'mm' | 'cm' | 'in'
      format?: 'a0' | 'a1' | 'a2' | 'a3' | 'a4' | 'letter' | 'legal'
      orientation?: 'p' | 'portrait' | 'l' | 'landscape'
    }
    pagebreak?: {
      mode?: string[]
      before?: string | string[]
      after?: string | string[]
      avoid?: string | string[]
    }
  }

  interface Html2Pdf {
    set(options: Html2PdfOptions): Html2Pdf
    from(element: HTMLElement | string): Html2Pdf
    toPdf(): Promise<any>
    toContainer(): Promise<any>
    toCanvas(): Promise<any>
    toImg(): Promise<any>
    save(filename?: string): Promise<void>
    output(type?: string, options?: any): Promise<any>
  }

  const html2pdf: (options?: Html2PdfOptions) => Html2Pdf

  export default html2pdf
}
