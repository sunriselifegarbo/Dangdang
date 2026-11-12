import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { zh } from './i18n/zh-CN'
import './style.css'

document.title = zh.appName
registerSW()
function Home() {
  return <><p className="eyebrow">{zh.stage}</p><h1>{zh.title}</h1><p className="muted">{zh.subtitle}</p>
    <div className="stats">{Object.entries(zh.status).map(([key, label]) => <article key={key}><strong>0</strong><span>{label}</span></article>)}</div>
    <section className="panel"><div className="mark" aria-hidden="true">✦</div><h2>{zh.ready}</h2><p className="muted">{zh.detail}</p></section></>
}
function App() {
  return <div className="shell"><header><div className="brand"><span className="brand-mark" aria-hidden="true">✦</span>{zh.appName}</div><span className="muted privacy">{zh.local}</span></header>
    <nav>{Object.entries(zh.nav).map(([key, label]) => <NavLink key={key} to={key === 'home' ? '/' : '/' + key}>{label}</NavLink>)}</nav>
    <main><Routes><Route path="/" element={<Home/>}/>{['words','history','settings'].map(path => <Route key={path} path={'/'+path} element={<section className="panel"><h1>{zh.nav[path as keyof typeof zh.nav]}</h1><p className="muted">{zh.placeholder}</p></section>}/>)}<Route path="*" element={<Home/>}/></Routes></main></div>
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><HashRouter><App/></HashRouter></React.StrictMode>)
