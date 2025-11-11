import React from 'react'
import { createRoot } from 'react-dom/client'
import KPI from './components/KPI'
import { callFn } from './api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer
} from 'recharts'

function useAsync(d=null){
  const [data,setData]=React.useState(d)
  const [loading,setLoading]=React.useState(false)
  const [err,setErr]=React.useState(null)
  return {
    data,loading,err,
    async run(p){
      try{ setLoading(true); setErr(null); setData(await p) }
      catch(e){ setErr(e.message||String(e)) }
      finally{ setLoading(false) }
    }
  }
}

const App=()=>{
  const [regions,setRegions]=React.useState([
    { id:'North', energy_kWh:50000, renewable_share_pct:38, grid_emission_factor_kg_per_kWh:0.45 },
    { id:'South', energy_kWh:42000, renewable_share_pct:55, grid_emission_factor_kg_per_kWh:0.42 },
    { id:'West',  energy_kWh:61000, renewable_share_pct:28, grid_emission_factor_kg_per_kWh:0.50 },
  ])
  const [startYear,setStartYear]=React.useState(2025)
  const [targetYear,setTargetYear]=React.useState(2030)
  const [targetShare,setTargetShare]=React.useState(70)

  const dash=useAsync(), marg=useAsync(), path=useAsync()

  const totalEnergy = regions.reduce((s,r)=>s+r.energy_kWh,0)
  const avgShare = (regions.reduce((s,r)=>s+r.renewable_share_pct,0)/regions.length).toFixed(1)

  const updateRegion = (i, key, val)=>{
    const next = regions.slice()
    next[i] = { ...next[i], [key]: val }
    setRegions(next)
  }

  const addRegion = ()=>{
    setRegions([...regions, {
      id:`R${regions.length+1}`,
      energy_kWh:30000,
      renewable_share_pct:45,
      grid_emission_factor_kg_per_kWh:0.48
    }])
  }

  const removeRegion = (i)=>{
    setRegions(regions.filter((_,k)=>k!==i))
  }

  return (
    <div className="wrap fade-in">

      {/* ✅ Back to Home */}
      <div className="btn-back-container">
        <a href="https://energy-verse-portal.netlify.app/?feature=11" className="btn-back-scroll">
          ← Back to Home
        </a>
      </div>

      {/* Header */}
      <div className="title">
        <div>
          <h1>CO₂ Impact — Dashboard</h1>
          <div className="sub">Emissions summary, marginal reductions and policy pathways.</div>
        </div>
        <div className="toolbar">
          <button onClick={()=>dash.run(callFn('co2_dashboard',{regions}))}>
            Compute
          </button>
          <button onClick={()=>marg.run(callFn('co2_marginal_reduction',{regions}))}>
            Marginal +1%
          </button>
          <button onClick={()=>path.run(callFn('co2_policy_pathway',{
            regions,
            startYear:parseInt(startYear),
            targetYear:parseInt(targetYear),
            targetSharePct:parseFloat(targetShare)
          }))}>
            Pathway
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <KPI label="Regions" value={regions.length}/>
        <KPI label="Total Energy" value={totalEnergy}/>
        <KPI label="Avg Renewable Share" value={`${avgShare}%`}/>
        <KPI label="Inputs Editable" value="Yes" hint="Modify inputs below"/>
      </div>

      {/* Layout */}
      <div className="grid" style={{marginTop:16}}>
        {/* Left column */}
        <div className="leftcol">
          <div className="card">
            <h3>Regions</h3>
            <div className="scroll-area">
              {regions.map((r,i)=>(
                <div key={i} className="region-box">
                  <div className="row" style={{justifyContent:'space-between', gap:12}}>
                    <input
                      value={r.id}
                      onChange={e=>updateRegion(i,'id',e.target.value)}
                      style={{maxWidth:160}}
                      placeholder="Region ID"
                    />
                    <button className="btn-danger" onClick={()=>removeRegion(i)}>Remove</button>
                  </div>

                  <div className="form-row" style={{marginTop:10}}>
                    <div className="label">Energy (kWh)</div>
                    <input
                      type="number"
                      value={r.energy_kWh}
                      onChange={e=>updateRegion(i,'energy_kWh',+e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="label">Renewable share %</div>
                    <input
                      type="number"
                      value={r.renewable_share_pct}
                      onChange={e=>updateRegion(i,'renewable_share_pct',+e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="label">Grid EF (kg/kWh)</div>
                    <input
                      type="number" step="0.01"
                      value={r.grid_emission_factor_kg_per_kWh}
                      onChange={e=>updateRegion(i,'grid_emission_factor_kg_per_kWh',+e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-soft" style={{marginTop:8}} onClick={addRegion}>
              ➕ Add Region
            </button>
          </div>

          <div className="card">
            <h3>Policy Path Params</h3>
            <div className="form-row">
              <div className="label">Start Year</div>
              <input type="number" value={startYear} onChange={e=>setStartYear(e.target.value)}/>
            </div>
            <div className="form-row">
              <div className="label">Target Year</div>
              <input type="number" value={targetYear} onChange={e=>setTargetYear(e.target.value)}/>
            </div>
            <div className="form-row">
              <div className="label">Target Share %</div>
              <input type="number" value={targetShare} onChange={e=>setTargetShare(e.target.value)}/>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="rightcol">
          <div className="card col-span-12">
            <h3>Emissions by Region</h3>
            {dash.data ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dash.data.by_region}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="id"/><YAxis/><Tooltip/><Legend/>
                  <Bar dataKey="emissions_kg" fill="#caff37"/>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="muted">Click Compute.</div>}

            {dash.data && (
              <div className="muted" style={{marginTop:8}}>
                Total Emissions: {dash.data.total_emissions_kg.toFixed(2)} kg
              </div>
            )}
          </div>

          <div className="card col-span-6">
            <h3>Marginal +1% Renewable</h3>
            {marg.data ? (
              <table>
                <thead>
                  <tr><th>Region</th><th>ΔRenew kWh</th><th>Avoided kg</th></tr>
                </thead>
                <tbody>
                  {marg.data.marginal.map(x=>(
                    <tr key={x.id}>
                      <td>{x.id}</td>
                      <td>{x.delta_renew_kWh}</td>
                      <td>{x.avoided_emissions_kg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="muted">Click Marginal +1%.</div>}
          </div>

          <div className="card col-span-6">
            <h3>Policy Pathway</h3>
            {path.data ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={path.data.pathway}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="year"/><YAxis/><Tooltip/><Legend/>
                  <Line dataKey="renewable_share_pct" stroke="#9aff65"/>
                  <Line dataKey="emissions_kg" stroke="#caff37"/>
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="muted">Run Pathway.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App/>)
