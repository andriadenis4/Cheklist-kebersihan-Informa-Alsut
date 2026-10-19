import React from 'react';
import { DayChecklist } from '../types/checklist';

interface PrintReportViewProps {
  checklist: DayChecklist;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({ checklist }) => {
  return (
    <div className="hidden print:block p-8 bg-white text-black font-sans">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wider">
          CHECKLIST KEBERSIHAN INFORMA ALAM SUTERA
        </h1>
      </div>

      {/* Meta Header */}
      <div className="flex justify-between items-center text-sm mb-4 border-b pb-2">
        <div>
          <span className="font-semibold">Lokasi :</span> {checklist.location}
        </div>
        <div>
          <span className="font-semibold">Tanggal / Bulan :</span> {checklist.date} ({checklist.bulan})
        </div>
      </div>

      {/* 12-Item Table */}
      <table className="w-full border-collapse border border-black text-xs mb-6">
        <thead>
          <tr className="bg-gray-100 border-b border-black text-center font-bold">
            <th className="border border-black p-2 w-8">No</th>
            <th className="border border-black p-2 text-left">Item Pemeriksaan</th>
            <th className="border border-black p-2 text-left">Standar</th>
            <th className="border border-black p-2 w-16">Pagi</th>
            <th className="border border-black p-2 w-16">Siang</th>
            <th className="border border-black p-2 w-16">Sore</th>
            <th className="border border-black p-2 w-16">Malam</th>
            <th className="border border-black p-2 text-left w-36">Ket.</th>
          </tr>
        </thead>
        <tbody>
          {checklist.items.map((item) => (
            <tr key={item.id} className="border-b border-black">
              <td className="border border-black p-2 text-center font-medium">{item.id}</td>
              <td className="border border-black p-2 font-semibold">{item.item}</td>
              <td className="border border-black p-2">{item.standar}</td>
              <td className="border border-black p-2 text-center">
                {item.pagi?.completed ? '✓ (' + item.pagi.formattedTime + ')' : '-'}
              </td>
              <td className="border border-black p-2 text-center">
                {item.siang?.completed ? '✓ (' + item.siang.formattedTime + ')' : '-'}
              </td>
              <td className="border border-black p-2 text-center">
                {item.sore?.completed ? '✓ (' + item.sore.formattedTime + ')' : '-'}
              </td>
              <td className="border border-black p-2 text-center">
                {item.malam?.completed ? '✓ (' + item.malam.formattedTime + ')' : '-'}
              </td>
              <td className="border border-black p-2">{item.keterangan || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pengisian Petugas Table */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase mb-2">Pengisian Petugas</h2>
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100 text-center font-bold">
              <th className="border border-black p-2 w-28">Shift</th>
              <th className="border border-black p-2 text-left">Nama Petugas</th>
              <th className="border border-black p-2 w-36">Jam</th>
              <th className="border border-black p-2 w-44">Paraf</th>
            </tr>
          </thead>
          <tbody>
            {checklist.petugas.map((p) => (
              <tr key={p.shift} className="border-b border-black">
                <td className="border border-black p-2 font-bold text-center">{p.shift}</td>
                <td className="border border-black p-2">{p.namaPetugas || '-'}</td>
                <td className="border border-black p-2 text-center">{p.jam || '-'}</td>
                <td className="border border-black p-2 text-center font-mono">{p.paraf || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Temuan & Tindakan Perbaikan Table */}
      <div>
        <h2 className="text-sm font-bold uppercase mb-2">Temuan & Tindakan Perbaikan</h2>
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100 text-center font-bold">
              <th className="border border-black p-2 w-28">Tanggal</th>
              <th className="border border-black p-2 text-left">Temuan</th>
              <th className="border border-black p-2 text-left">Tindakan</th>
              <th className="border border-black p-2 w-36">PIC</th>
              <th className="border border-black p-2 w-28">Status</th>
            </tr>
          </thead>
          <tbody>
            {checklist.temuan.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-black p-4 text-center italic text-gray-500">
                  Tidak ada temuan dilaporkan
                </td>
              </tr>
            ) : (
              checklist.temuan.map((t) => (
                <tr key={t.id} className="border-b border-black">
                  <td className="border border-black p-2 text-center">{t.tanggal}</td>
                  <td className="border border-black p-2 font-medium">{t.temuan}</td>
                  <td className="border border-black p-2">{t.tindakan}</td>
                  <td className="border border-black p-2">{t.pic}</td>
                  <td className="border border-black p-2 text-center font-bold">{t.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Signature Signoff Footer */}
      <div className="mt-8 flex justify-between text-xs pt-4">
        <div className="text-center w-48">
          <div>Petugas Pelaksana (OB)</div>
          <div className="h-16" />
          <div className="border-t border-black pt-1">( ........................................ )</div>
        </div>
        <div className="text-center w-48">
          <div>Duty Manager / Incharge</div>
          <div className="h-16" />
          <div className="border-t border-black pt-1">( ........................................ )</div>
        </div>
      </div>
    </div>
  );
};
