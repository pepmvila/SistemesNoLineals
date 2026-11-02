/** AFEGIR AL FINAL DEL FITXER QUE JA DECLARA const JOCS.
 * No substitueix el servidor existent. Conserva FULL_ID i l'URL /exec.
 * Executa preparaSistemesNoLineals i publica una nova versió del desplegament.
 */
JOCS['sistemes-no-lineals-1batx'] = {
  name: 'Sistemes no lineals · 1r Batxillerat',
  sheet: 'Sistemes no lineals',
  ids: ['quadratic','cubic','powers','xy','rational','radical','exponential','logarithmic']
    .reduce((a,t)=>a.concat([0,1,2].map(l=>t+'-'+l)),[]),
  titles: ['Quadràtics','Cúbics','Altres potències','Productes xy','Racionals','Radicals','Exponencials','Logarítmics']
    .reduce((a,t)=>a.concat(['Fàcil','Mitjana','Difícil'].map(l=>t+' · '+l)),[])
};
function preparaSistemesNoLineals() {
  const lock=LockService.getScriptLock(); lock.waitLock(25000);
  try {
    const ss=full();
    preparaJoc(ss,'sistemes-no-lineals-1batx');
    preparaPerfils(ss);
    let sh=ss.getSheetByName('Jocs');
    if(!sh){sh=ss.insertSheet('Jocs');capcalera(sh,['ID','Títol']);}
    if(!sh.getDataRange().getValues().some(r=>r[0]==='sistemes-no-lineals-1batx'))
      sh.appendRow(['sistemes-no-lineals-1batx',JOCS['sistemes-no-lineals-1batx'].name]);
  } finally {lock.releaseLock();}
}
