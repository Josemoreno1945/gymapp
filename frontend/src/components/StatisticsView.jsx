import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function StatisticsView({ data }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="glass-card p-3 rounded-lg border border-[#ff2d78]/50 text-xs font-mono shadow-[0_0_15px_rgba(255,45,120,0.3)]">
          <p className="text-white mb-1 font-bold">{point.semana_nombre}</p>
          <p className="text-[#ff2d78] text-sm font-bold drop-shadow-[0_0_5px_#ff2d78]">
            {point.max_peso} {point.unidad}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 mb-5 border-b border-neutral-900 pb-3">
        <TrendingUp size={18} className="text-[#ff2d78] drop-shadow-[0_0_6px_#ff2d78]" />
        <h2 className="font-mono font-bold text-[#ff2d78] text-sm uppercase tracking-widest text-glow-pink">
          Progreso por Semana (Peso Máximo)
        </h2>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis 
              dataKey="semana_nombre" 
              stroke="#444" 
              tick={{fill: '#888', fontSize: 10, fontFamily: 'monospace'}}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#444" 
              tick={{fill: '#888', fontSize: 10, fontFamily: 'monospace'}}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ff2d78', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Line 
              type="monotone" 
              dataKey="max_peso" 
              stroke="#ff2d78" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#050505', stroke: '#ff2d78', strokeWidth: 2, filter: 'drop-shadow(0px 0px 4px #ff2d78)' }}
              activeDot={{ r: 6, fill: '#ff2d78', stroke: '#fff', strokeWidth: 2, filter: 'drop-shadow(0px 0px 8px #ff2d78)' }}
              style={{
                filter: 'drop-shadow(0px 0px 8px rgba(255, 45, 120, 0.4))'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
