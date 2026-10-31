// Newly defined journeys never auto-inherit named owners from the previous organisation.
state=normalizeState(initState());bpUpdateOwners();
document.addEventListener('click',clickHandler);
document.addEventListener('submit',onSubmit);
document.addEventListener('change',onChange);
document.addEventListener('input',onInput);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(document.getElementById('bp-dialog'))return;if(document.getElementById('feature-layer'))document.getElementById('feature-layer').remove();else if(currentModal)closeModal();else if(view.guideOpen){view.guideOpen=false;render(true);}}});
document.addEventListener('click',e=>{if(e.target.id==='modal-layer')closeModal();if(e.target.id==='feature-layer')e.target.remove();});
document.getElementById('import-file').addEventListener('change',importFile);
window.addEventListener('beforeunload',e=>{if(jsonDirty){e.preventDefault();e.returnValue='';}});
render();startupLinkedFile();
