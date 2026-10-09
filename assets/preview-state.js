(() => {
  const key='ai-avatars:preview:'+location.pathname;
  let state=null;
  try{state=JSON.parse(localStorage.getItem(key)||'null');}catch{}
  window.avatarState={
    widgetState:state,
    async setWidgetState(next){
      this.widgetState=next;
      try{localStorage.setItem(key,JSON.stringify(next));}catch{}
    }
  };
})();
