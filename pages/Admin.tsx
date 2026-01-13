
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { useAuth } from '../services/auth';
import { Reservation, ReservationStatus, UserProfile } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { 
  Users, Calendar, DollarSign, Filter, Search, 
  Clock, CheckCircle, UserPlus, AlertTriangle, Download, Database 
} from 'lucide-react';
import { DateRangePicker } from '../components/DateRangePicker';
import { Exporter } from '../utils/exporter';

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de Filtro
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'guests' | 'backup'>('dashboard');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<{start: Date | null, end: Date | null}>({start: null, end: null});
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resData, profData] = await Promise.all([
        db.getReservations(),
        db.getAllProfiles()
      ]);
      setReservations(resData);
      setProfiles(profData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro desconhecido ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (type: 'json' | 'csv') => {
    setIsExporting(true);
    try {
        const backupData = await db.getFullBackupData();
        
        if (type === 'json') {
            Exporter.exportJSON(backupData, 'chale_serracrato_full');
        } else {
            // CSV Export logic - separate files
            Exporter.exportCSV(backupData.reservations, 'reservas');
            setTimeout(() => Exporter.exportCSV(backupData.profiles, 'usuarios'), 500); // Small delay
        }
        alert('Download iniciado com sucesso! Guarde estes arquivos em local seguro.');
    } catch (err: any) {
        alert('Erro ao exportar dados: ' + err.message);
    } finally {
        setIsExporting(false);
    }
  };

  // --- Lógica de Filtros ---
  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
      const matchesSearch = res.userName.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDate = true;
      if (dateFilter.start && dateFilter.end) {
        const resDate = new Date(res.checkIn);
        matchesDate = resDate >= dateFilter.start && resDate <= dateFilter.end;
      }

      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [reservations, statusFilter, searchTerm, dateFilter]);

  // --- Lógica do Dashboard (Estatísticas) ---
  const stats = useMemo(() => {
    const totalRevenue = filteredReservations
        .filter(r => r.status !== ReservationStatus.CANCELLED)
        .reduce((acc, curr) => acc + curr.totalPrice, 0);
    
    const totalGuests = filteredReservations
        .filter(r => r.status !== ReservationStatus.CANCELLED)
        .reduce((acc, curr) => acc + curr.guests, 0);

    const totalUsers = profiles.length;

    // Agrupamento por mês para o gráfico
    const monthlyDataMap = new Map();
    filteredReservations.forEach(r => {
        if (r.status === ReservationStatus.CANCELLED) return;
        const date = new Date(r.checkIn);
        const key = `${date.getMonth() + 1}/${date.getFullYear()}`; // ex: 1/2024
        
        if (!monthlyDataMap.has(key)) {
            monthlyDataMap.set(key, { name: key, receita: 0, hospedes: 0 });
        }
        const entry = monthlyDataMap.get(key);
        entry.receita += r.totalPrice;
        entry.hospedes += r.guests;
    });

    const chartData = Array.from(monthlyDataMap.values());

    return { totalRevenue, totalGuests, totalUsers, chartData };
  }, [filteredReservations, profiles]);

  if (loading) return <div className="p-12 flex justify-center text-chalet-green"><Clock className="animate-spin mr-2"/> Carregando painel...</div>;

  if (error) {
    return (
        <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100 max-w-lg text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Erro ao carregar dados</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button 
                    onClick={fetchData}
                    className="bg-chalet-green text-white px-6 py-3 rounded-lg font-bold hover:bg-chalet-greenLight transition"
                >
                    Tentar Novamente
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-chalet-green text-white py-8 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-3xl font-serif">Painel Administrativo</h1>
                <p className="text-chalet-gold opacity-90 text-sm mt-1">Monitoramento de reservas e hóspedes</p>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-6">
        {/* Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            {[
                { id: 'dashboard', label: 'Visão Geral', icon: <DollarSign size={18} /> },
                { id: 'bookings', label: 'Todas as Reservas', icon: <Calendar size={18} /> },
                { id: 'guests', label: 'Lista de Hóspedes', icon: <Users size={18} /> },
                { id: 'backup', label: 'Backup e Segurança', icon: <Database size={18} /> },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold transition-all shadow-sm flex-shrink-0 ${
                        activeTab === tab.id 
                        ? 'bg-white text-chalet-green border-t-4 border-chalet-gold' 
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>

        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-4 bg-green-100 text-green-700 rounded-full"><DollarSign size={24} /></div>
                        <div>
                            <p className="text-sm text-gray-500 uppercase font-bold">Receita Estimada</p>
                            <h3 className="text-2xl font-serif text-gray-800">R$ {stats.totalRevenue.toLocaleString('pt-BR')}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-4 bg-blue-100 text-blue-700 rounded-full"><Users size={24} /></div>
                        <div>
                            <p className="text-sm text-gray-500 uppercase font-bold">Hóspedes Totais</p>
                            <h3 className="text-2xl font-serif text-gray-800">{stats.totalGuests}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-4 bg-indigo-100 text-indigo-700 rounded-full"><UserPlus size={24} /></div>
                        <div>
                            <p className="text-sm text-gray-500 uppercase font-bold">Usuários Totais</p>
                            <h3 className="text-2xl font-serif text-gray-800">{stats.totalUsers}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-4 bg-purple-100 text-purple-700 rounded-full"><Calendar size={24} /></div>
                        <div>
                            <p className="text-sm text-gray-500 uppercase font-bold">Reservas Ativas</p>
                            <h3 className="text-2xl font-serif text-gray-800">
                                {filteredReservations.filter(r => r.status === ReservationStatus.CONFIRMED).length}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-6">Receita Mensal</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => `R$ ${value}`} />
                                <Legend />
                                <Bar dataKey="receita" fill="#1a3c34" name="Receita (R$)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {/* --- BOOKINGS TAB --- */}
        {activeTab === 'bookings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                {/* Filters Bar */}
                <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Buscar por nome..." 
                                className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-chalet-gold outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select 
                            className="p-2 border rounded-lg text-sm bg-white"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Todos Status</option>
                            <option value={ReservationStatus.PENDING}>Pendentes</option>
                            <option value={ReservationStatus.CONFIRMED}>Confirmadas</option>
                            <option value={ReservationStatus.CANCELLED}>Canceladas</option>
                            <option value={ReservationStatus.COMPLETED}>Concluídas</option>
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                         <span className="text-sm font-bold text-gray-500">
                             {dateFilter.start && dateFilter.end 
                                ? `${dateFilter.start.toLocaleDateString()} - ${dateFilter.end.toLocaleDateString()}` 
                                : 'Todas as Datas'}
                         </span>
                         <button 
                            onClick={() => setIsDatePickerOpen(true)}
                            className="p-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-600"
                            title="Filtrar por data"
                        >
                             <Filter size={18} />
                         </button>
                         {dateFilter.start && (
                             <button onClick={() => setDateFilter({start: null, end: null})} className="text-xs text-red-500 underline">Limpar</button>
                         )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Cliente</th>
                            <th className="px-6 py-3">Check-in / Out</th>
                            <th className="px-6 py-3">Detalhes</th>
                            <th className="px-6 py-3">Valor</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredReservations.map((res) => (
                            <tr key={res.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">{res.userName}</td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="text-chalet-green font-bold">{new Date(res.checkIn).toLocaleDateString()}</span>
                                    <span className="text-gray-400 text-xs">até {new Date(res.checkOut).toLocaleDateString()}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <span title="Hóspedes" className="flex items-center gap-1"><Users size={14} /> {res.guests}</span>
                                    {res.pets > 0 && <span title="Pets" className="flex items-center gap-1 text-chalet-gold">🐕 {res.pets}</span>}
                                </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-800">R$ {res.totalPrice.toFixed(2)}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                res.status === ReservationStatus.CONFIRMED ? 'bg-green-100 text-green-800' :
                                res.status === ReservationStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                                res.status === ReservationStatus.COMPLETED ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                                }`}>
                                {res.status}
                                </span>
                            </td>
                            </tr>
                        ))}
                        {filteredReservations.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center">Nenhuma reserva encontrada com os filtros atuais.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- GUESTS TAB --- */}
        {activeTab === 'guests' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                {/* Future Guests */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-chalet-green mb-4 flex items-center gap-2"><Clock size={20} /> Próximos Hóspedes</h3>
                    <div className="space-y-4">
                        {filteredReservations
                            .filter(r => new Date(r.checkIn) >= new Date() && r.status === ReservationStatus.CONFIRMED)
                            .sort((a,b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
                            .map(r => (
                                <div key={r.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-bold text-gray-800">{r.userName}</p>
                                        <p className="text-xs text-gray-500">Chegada: {new Date(r.checkIn).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">{r.guests} Pessoas</span>
                                    </div>
                                </div>
                            ))
                        }
                        {filteredReservations.filter(r => new Date(r.checkIn) >= new Date() && r.status === ReservationStatus.CONFIRMED).length === 0 && 
                            <p className="text-gray-400 italic text-sm">Nenhum hóspede agendado.</p>
                        }
                    </div>
                </div>

                {/* Past Guests */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-600 mb-4 flex items-center gap-2"><CheckCircle size={20} /> Histórico Recente</h3>
                    <div className="space-y-4">
                         {filteredReservations
                            .filter(r => new Date(r.checkOut) < new Date() && r.status !== ReservationStatus.CANCELLED)
                            .sort((a,b) => new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime())
                            .slice(0, 5) // Show last 5
                            .map(r => (
                                <div key={r.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-bold text-gray-700">{r.userName}</p>
                                        <p className="text-xs text-gray-500">Saiu em: {new Date(r.checkOut).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                         <span className="text-green-600 font-bold text-xs">Concluído</span>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        )}

        {/* --- BACKUP TAB --- */}
        {activeTab === 'backup' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-4 text-chalet-green">
                        <Database size={28} />
                        <h2 className="text-xl font-bold font-serif">Exportação de Dados</h2>
                    </div>
                    <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                        Faça o download regular dos dados para garantir a continuidade do negócio em caso de falha de conexão ou para análises externas (Excel).
                    </p>
                    
                    <div className="space-y-4">
                        <button 
                            onClick={() => handleExportData('csv')}
                            disabled={isExporting}
                            className="w-full flex items-center justify-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-chalet-green hover:text-white transition-all group font-bold"
                        >
                            <div className="p-2 bg-white rounded text-green-600 group-hover:text-chalet-green shadow-sm"><Download size={20}/></div>
                            Exportar Relatórios (.CSV)
                            <span className="text-xs font-normal opacity-70 ml-auto">Compatível com Excel</span>
                        </button>

                        <button 
                             onClick={() => handleExportData('json')}
                             disabled={isExporting}
                             className="w-full flex items-center justify-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-chalet-gold hover:text-white transition-all group font-bold"
                        >
                            <div className="p-2 bg-white rounded text-orange-500 group-hover:text-chalet-gold shadow-sm"><Database size={20}/></div>
                            Backup Completo (.JSON)
                            <span className="text-xs font-normal opacity-70 ml-auto">Para Restauração</span>
                        </button>
                    </div>
                </div>

                <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-100 p-8">
                    <div className="flex items-center gap-3 mb-4 text-blue-800">
                        <AlertTriangle size={28} />
                        <h2 className="text-xl font-bold font-serif">Política de Retenção</h2>
                    </div>
                    <ul className="space-y-4 text-sm text-blue-900">
                        <li className="flex gap-2">
                            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <span><strong>Backup Automático:</strong> O banco de dados é gerenciado pelo Supabase. Recomendamos ativar o PITR (Point in Time Recovery) no painel do Supabase para backups diários automáticos.</span>
                        </li>
                        <li className="flex gap-2">
                            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <span><strong>Proteção de Histórico:</strong> O sistema bloqueia a exclusão de reservas antigas já concluídas para proteger seu histórico financeiro.</span>
                        </li>
                        <li className="flex gap-2">
                            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <span><strong>Segurança:</strong> Nunca compartilhe os arquivos JSON exportados, pois eles contêm dados sensíveis dos clientes.</span>
                        </li>
                    </ul>
                </div>
            </div>
        )}

      </div>

      {/* --- MODALS --- */}
      <DateRangePicker 
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedRange={{startDate: dateFilter.start, endDate: dateFilter.end}}
        onChange={(r) => setDateFilter({start: r.startDate, end: r.endDate})}
      />
    </div>
  );
};
