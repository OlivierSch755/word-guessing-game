

document.getElementById("game").addEventListener("submit", (e)=>{
	e.preventDefault()
})

const params = Object.fromEntries(new URLSearchParams(window.location.search));
if(params.g){
	const p2 = await import("/js/player2.js");
}
else{
	const p1 = await import("/js/player1.js");
}


