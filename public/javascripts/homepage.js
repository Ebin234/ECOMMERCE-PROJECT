const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');



 if(bar){
      bar.addEventListener('click', ()=>{
          nav.classList.add('active');
          document.getElementById('drop').style.display = 'none'
          document.getElementById('logout').style.display = 'block'
          document.getElementById('order').style.display = 'block'
      })
  }

 if(close){
     close.addEventListener('click', (e)=>{
         nav.classList.remove('active');
         e.preventDefault();
     })
 }