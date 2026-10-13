const paths={
 learn:'M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z M12 6v14',
 back:'M18 5l-8 7 8 7 M6 5v14',
 play:'M7 4l14 8-14 8z',
 pause:'M8 4v16 M16 4v16',
 next:'M6 5l8 7-8 7 M18 5v14',
 replay:'M4 10a8 8 0 1 1 1 8 M4 4v6h6',
 sound:'M4 9h4l5-4v14l-5-4H4z M16 8a6 6 0 0 1 0 8 M19 5a10 10 0 0 1 0 14',
 muted:'M4 9h4l5-4v14l-5-4H4z M17 9l5 6 M22 9l-5 6',
 exit:'M10 4H4v16h6 M11 12h11 M18 8l4 4-4 4',
 keep:'M4 12l5 5L20 6',
} as const;
export type Icon=keyof typeof paths;
export const icon=(name:Icon)=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
export function button(el:HTMLElement,name:Icon,label:string){
 el.innerHTML=icon(name)+`<span>${label}</span>`;
 el.setAttribute('aria-label',label);el.setAttribute('title',label);
}
