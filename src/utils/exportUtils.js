import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportCalendarAsPDF(containerId) {
  const input = document.getElementById(containerId);
  const canvas = await html2canvas(input);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF();
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save('calendar.pdf');
}

export async function exportCalendarAsPNG(containerId) {
  const input = document.getElementById(containerId);
  const canvas = await html2canvas(input);
  const link = document.createElement('a');
  link.download = 'calendar.png';
  link.href = canvas.toDataURL();
  link.click();
}

export function exportDataAsCSV(data) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  const csvContent = [headers, ...rows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'market-data.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}