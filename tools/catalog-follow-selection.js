  // This channel only changes the displayed catalog card; it never changes file/status data.
  var selectionRevision=0,selectionPolling=false;
  function followWorkshop(){
    if(!remote||selectionPolling)return;
    selectionPolling=true;
    request('api/catalog/selection').then(function(v){
      if(!v.path||v.id===selectionRevision)return;
      selectionRevision=v.id;
      var url=new URL(location.href);url.searchParams.set('image',v.path);
      history.replaceState(null,'',url);
      locate(v.path);
    }).catch(function(){}).finally(function(){selectionPolling=false;});
  }
  window.addEventListener('focus',followWorkshop);
  setInterval(followWorkshop,1000);
