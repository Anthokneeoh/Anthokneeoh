import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowDown, Check, ChevronDown, Database, Gauge, Layers3, Network, Server, Smartphone, Timer, TriangleAlert, X } from 'lucide-react';
import './styles.css';

type Strategy = 'up' | 'out';
const trafficOptions = [{ value: 100, label: 'Baseline' }, { value: 200, label: 'Increased' }, { value: 360, label: 'Traffic spike' }, { value: 600, label: 'Flash surge' }];

function App() {
  const [traffic, setTraffic] = useState(360);
  const [strategy, setStrategy] = useState<Strategy>('up');
  const [capacity, setCapacity] = useState(500);
  const [depth, setDepth] = useState(65);
  const processing = strategy === 'up' ? 340 : 640;
  useEffect(() => {
    const id = window.setInterval(() => setDepth(old => {
      const next = old + (traffic - processing) * .12;
      return Math.max(0, Math.min(capacity, next));
    }), 350);
    return () => clearInterval(id);
  }, [traffic, processing, capacity]);
  useEffect(() => setDepth(old => Math.min(old, capacity)), [capacity]);
  const model = useMemo(() => {
    const queuePercent = Math.round(depth / capacity * 100);
    const rejected = depth >= capacity - 0.5 ? Math.max(0, traffic - processing) : 0;
    const util = Math.min(100, Math.round(Math.min(traffic + Math.min(depth, processing), processing) / processing * 100));
    const state = rejected > 0 ? 'critical' : queuePercent >= 70 || util >= 80 ? 'warning' : 'healthy';
    return { queuePercent, rejected, util, state, processed: Math.min(processing, traffic + depth) };
  }, [depth, capacity, traffic, processing]);
  const copy = model.state === 'critical' ? ['Queue saturated', 'New requests are rejected to protect the workers.'] : model.state === 'warning' ? ['Under pressure', 'Work is accumulating faster than it can be cleared.'] : ['System stable', 'Workers are keeping pace with incoming work.'];
  const statusIcon = model.state === 'critical' ? <X /> : model.state === 'warning' ? <TriangleAlert /> : <Check />;
  return <main>
    <section className="hero"><div className="eyebrow"><span></span> INTERACTIVE SYSTEM DESIGN LAB</div><h1>See how systems<br /><i>handle traffic.</i></h1><p>Explore the trade-offs between capacity, queues, and scaling—one request at a time.</p></section>
    <section className="shell">
      <header className="toolbar"><div className="brand"><Activity size={19}/><span>Traffic Lab</span><b>LIVE</b></div><div className="top-state"><span className={'dot '+model.state}></span>{copy[0]}</div></header>
      <div className="controls">
        <label><span>Traffic load</span><div className="select-wrap"><select value={traffic} onChange={e => setTraffic(Number(e.target.value))}>{trafficOptions.map(t=><option key={t.value} value={t.value}>{t.label} · {t.value} req/s</option>)}</select><ChevronDown size={16}/></div></label>
        <fieldset><legend>Scaling strategy</legend><div className="segmented"><button className={strategy==='up'?'active':''} onClick={()=>setStrategy('up')}><Server size={16}/> Scale up</button><button className={strategy==='out'?'active':''} onClick={()=>setStrategy('out')}><Layers3 size={16}/> Scale out</button></div></fieldset>
        <label className="range-label"><span>Queue capacity <strong>{capacity} req</strong></span><input aria-label="Queue capacity" type="range" min="100" max="1000" step="50" value={capacity} onChange={e=>setCapacity(Number(e.target.value))}/><small>100 <em>1000 req</em></small></label>
      </div>
      <div className="sim-grid">
        <section className="diagram" aria-label="Live request flow diagram">
          <div className="diagram-head"><div><span className="micro">LIVE ARCHITECTURE</span><h2>Request flow</h2></div><div className="flow-key"><span className="pulse"></span> Requests in motion</div></div>
          <div className="flow-layout">
            <Node className="client" icon={<Smartphone/>} title="Mobile client" sub={`${traffic} req/s`} tone={model.state}><span className="traffic-badge">{traffic} <small>REQ/S</small></span></Node>
            <Flow rate={traffic} />
            <Node icon={<Network/>} title="Load balancer" sub="Distributing traffic" tone={model.state}><div className="bars"><i></i><i></i><i></i></div></Node>
            <Flow rate={traffic} />
            <Queue depth={depth} capacity={capacity} percent={model.queuePercent} state={model.state} />
            <Flow rate={Math.round(model.processed)} />
            <Servers strategy={strategy} utilization={model.util} state={model.state}/>
            <Flow rate={Math.round(model.processed)} />
            <Node icon={<Database/>} title="PostgreSQL" sub={`${Math.round(model.processed*.72)} writes/s`} tone={model.state}><div className="db-lines"><i/><i/><i/></div></Node>
          </div>
          {model.rejected > 0 && <div className="rejection"><X size={16}/><b>429 Too Many Requests</b><span>{Math.round(model.rejected)} req/s rejected — the buffer is full.</span></div>}
        </section>
        <aside className="side-panel"><section className={'status '+model.state}><div className="status-symbol">{statusIcon}</div><div><span className="micro">SYSTEM STATUS</span><h3>{copy[0]}</h3></div><p>{copy[1]}</p></section><section className="metrics"><h3>Live telemetry</h3><Metric icon={<Activity/>} label="Traffic" value={`${traffic}`} unit="req/s"/><Metric icon={<Timer/>} label="Queue depth" value={`${Math.round(depth)}`} unit={`/ ${capacity} req`} bar={model.queuePercent}/><Metric icon={<Gauge/>} label="Server utilization" value={`${model.util}`} unit="%" bar={model.util}/><Metric icon={<ArrowDown/>} label="Processing" value={`${Math.round(model.processed)}`} unit="req/s"/><Metric alert={model.rejected > 0} icon={<X/>} label="Rejected" value={`${Math.round(model.rejected)}`} unit="req/s"/></section></aside>
      </div>
      <footer className="insights"><div><span className="insight-icon"><Server/></span><h3>{strategy==='up'?'Scale up':'Scale out'}</h3><p>{strategy==='up'?'One 32-core machine concentrates capacity in a single powerful worker.':'Four independent workers share the load, raising total throughput.'}</p></div><div><span className="insight-icon"><Layers3/></span><h3>Message queue</h3><p>Buffers short bursts so producers can keep sending while workers catch up.</p></div><div><span className="insight-icon"><TriangleAlert/></span><h3>Backpressure</h3><p>When the buffer fills, the system rejects new work rather than falling over.</p></div></footer>
    </section>
  </main>
}
function Node({icon,title,sub,children,className='',tone}:{icon:React.ReactNode,title:string,sub:string,children:React.ReactNode,className?:string,tone:string}) { return <div className={'node '+className+' '+tone}><div className="node-icon">{icon}</div><div><strong>{title}</strong><small>{sub}</small></div>{children}</div> }
function Flow({rate}:{rate:number}) { return <div className="flow"><span style={{animationDuration:`${Math.max(.5, 2.5-rate/300)}s`}}></span><span style={{animationDuration:`${Math.max(.5, 2.5-rate/300)}s`,animationDelay:'.6s'}}></span><span style={{animationDuration:`${Math.max(.5, 2.5-rate/300)}s`,animationDelay:'1.2s'}}></span><b>{rate} req/s</b></div> }
function Queue({depth,capacity,percent,state}:{depth:number,capacity:number,percent:number,state:string}) { const blocks = Array.from({length: 32}, (_,i)=> i < Math.ceil(percent/100*32)); return <div className={'queue '+state}><div className="queue-top"><div className="node-icon"><Layers3/></div><div><strong>Message queue</strong><small>{state==='critical'?'BUFFER FULL':state==='warning'?'BUFFER FILLING':'BUFFER READY'}</small></div><b>{percent}%</b></div><div className="buffer">{blocks.map((on,i)=><i key={i} className={on?'filled':''}/>)}</div><div className="queue-foot"><span>{Math.round(depth)} waiting</span><span>{capacity} req capacity</span></div></div> }
function Servers({strategy,utilization,state}:{strategy:Strategy,utilization:number,state:string}) { return <div className={'servers '+strategy}><div className="server-title"><Server size={16}/><span>{strategy==='up'?'Application server · 32 cores':'Application servers · 4 × 8 cores'}</span><b>{utilization}%</b></div><div className="server-list">{Array.from({length:strategy==='up'?1:4},(_,i)=><div className={'server '+state} key={i}><Server size={strategy==='up'?28:18}/><span>{strategy==='up'?'32-core instance':`Worker ${i+1}`}</span><div><i style={{width:`${utilization}%`}}/></div></div>)}</div></div> }
function Metric({icon,label,value,unit,bar,alert=false}:{icon:React.ReactNode,label:string,value:string,unit:string,bar?:number,alert?:boolean}) { return <div className={'metric '+(alert?'alert':'')}><span className="metric-icon">{icon}</span><div className="metric-content"><span>{label}</span>{bar!==undefined&&<div className="metric-bar"><i style={{width:`${bar}%`}}/></div>}</div><strong>{value}<small>{unit}</small></strong></div> }
createRoot(document.getElementById('root')!).render(<App/>);
