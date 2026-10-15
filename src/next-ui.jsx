// Reusable layout primitives; no game logic, transport, authentication or writes.
export function Frame({sidebar,mobileHeader,title,actions,children,bottomNav}){
 const heading=React.useRef(null);
 React.useEffect(()=>{heading.current?.focus({preventScroll:true})},[title]);
 return <><div className="app-shell">{sidebar}<div className="page-shell">{mobileHeader}<header className="page-header"><h1 ref={heading} tabIndex={-1}>{title}</h1>{actions}</header>{children}<footer className="page-footer"><span>FACTOR × FACTOR</span><span>先生専用機能は権限確認後に表示</span></footer></div></div>{bottomNav}</>;
}
export function Panel({title,children,aside,...props}){return <section className="next-panel" {...props}><div className="next-section-heading"><h2>{title}</h2>{aside}</div>{children}</section>}
export function Stat({label,value,note,...props}){return <div className="next-stat" {...props}><dt>{label}</dt><dd>{value??'未記録'}</dd>{note&&<small>{note}</small>}</div>}
export function MetricGrid({children}){return <dl className="next-metrics">{children}</dl>}
export function BackButton({onClick,children='戻る'}){return <button className="small-button" onClick={onClick}>{children}</button>}
