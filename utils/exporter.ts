
export const Exporter = {
  /**
   * Converte um array de objetos JSON para formato CSV
   */
  toCSV: (data: any[], headers?: string[]): string => {
    if (!data || data.length === 0) return '';
    
    const keys = headers || Object.keys(data[0]);
    const csvRows = [];

    // Header
    csvRows.push(keys.join(','));

    // Rows
    for (const row of data) {
      const values = keys.map(key => {
        const val = row[key];
        const escaped = ('' + (val ?? '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  },

  /**
   * Dispara o download de um arquivo no navegador
   */
  downloadFile: (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  /**
   * Exporta dados em formato JSON (Backup Completo)
   */
  exportJSON: (data: any, prefix: string) => {
    const fileName = `${prefix}_backup_${new Date().toISOString().split('T')[0]}.json`;
    const jsonStr = JSON.stringify(data, null, 2);
    Exporter.downloadFile(jsonStr, fileName, 'application/json');
  },

  /**
   * Exporta dados em formato CSV (Para Excel/Business)
   */
  exportCSV: (data: any[], prefix: string) => {
    const fileName = `${prefix}_report_${new Date().toISOString().split('T')[0]}.csv`;
    const csvStr = Exporter.toCSV(data);
    Exporter.downloadFile(csvStr, fileName, 'text/csv');
  }
};
