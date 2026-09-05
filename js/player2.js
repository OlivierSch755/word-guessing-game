import {Game, WordTile,TileSlot } from "/js/system.js";
import {DictLoader} from "/js/dictloader.js";
import {Random, rangeFromZeroTo, StyleSetter} from "/js/utils.js";
import {LocalMemory} from "/js/storage.js";

import interact from 'https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js'



class GamePlayer2 extends Game{
	
	id;
	date_add;
	player1Name = null;
	victory = false;
	
	_attempts = 0;
	
	
	get attempts(){
		return this._attempts;
	}
		
	set attempts(nb){
		this._attempts = nb;
		document.querySelector("#attempts_counter").innerText = nb;
	}
	
	autoSolve(){
		const wordsTiles = [...document.querySelectorAll("words-tile")];
		wordsTiles.forEach(wt=>{
			wt.setState(wt.solution.r,wt.solution.i);
		});
	}
	
	
	async submit(){
		
		super.submit();
		

		if(this.victory) return;
		
		this.attempts++;
		
		const wordsTiles = [...document.querySelectorAll("words-tile")];
		const badTiles = [];
		const goodTiles = [];
		
		
		
		wordsTiles.forEach( wt =>{
			
			wt.saveStateAsAttempted();
			
			if(wt.checkSolution()){
				goodTiles.push(wt);
				wt.lockVictory()
				return;
			}
			badTiles.push(wt);
			wt.reset();
		})
		
		if(badTiles.length === 0){
			alert("Bravo tu as gagné");
			this.victory = true;
		}
		
		this.saveGameState(this.victory);
	}
	
	async initBoard(){
		
		super.initBoard();
		
		const savedState = await this.loadBoardState();
		
		this.populateUserWords();
		this.populateWordsTiles();
		
		if(savedState){
			this.applySavedState(savedState); // should happen after populateUserWords since it sets all rotation to default value of zero
		}
		Player2WordsTileV2.initInteractions();
		TileSlotPlayer2.initInteractions();	
		
	}
	
	populateWordsTiles(){
		document.querySelectorAll("words-tile").forEach( (wordsTile,index)=>{
			wordsTile.classList.remove("no-transition");
			const baseDataEntry = this.baseData.wordsData[index];
			wordsTile.setAttribute("src", baseDataEntry.address.join(','))
			wordsTile.setRotation(0);
			wordsTile.solution = {r : baseDataEntry.r, i : baseDataEntry.i}
		})
	}
	
	populateUserWords(){
		this.getUserInputs().forEach( (ui,i)=>{
			ui.innerText = this.baseData.userWords[i];
		})
	}
	
	
	async saveGameState(victorySave){
		
		if(this.victory && !victorySave) return;
		
		const serializedState = {
			w : [...document.querySelectorAll('words-tile')].map(x=>[x.r, x.i, x.victoryLock, [...x.pastAttempts]]),
			d : ( this.date_add || new Date() ).getTime(),
			u : new Date().getTime(),
			a : this.attempts,
			v : this.victory
		}
		LocalMemory.saveGameState(this.id,serializedState);
	}
	
	async loadBoardState(){
		const savedState = LocalMemory.loadGameState(this.id);
		if(!savedState){
			await this.saveGameState(); // will save the dateTime at which the game was opened
			return
		};
		return savedState;
	}
	
	applySavedState(savedState){
		document.querySelectorAll("words-tile").forEach( (wordsTile,index)=>{
			const r = savedState.w[index][0];
			const i = savedState.w[index][1];
			const victory = savedState.w[index][2];
			const wt_past_attempts = savedState.w[index][3];
			wordsTile.setState(r,i);
			wordsTile.pastAttempts = new Set(wt_past_attempts);
			wordsTile.autoSetClassLastAttempted();
			if(victory) wordsTile.lockVictory();
		});
		
		this.victory = savedState.v;
		this.attempts = savedState.a;
		this.date_add = new Date(savedState.d);
	}
	
	
	
}

class TileSlotPlayer2 extends TileSlot{
	
	_matrix = new DOMMatrix();
	_boundingBox;
	wordsTiles = [];
	victoryLock = false; // to track if no more wordsTiles can be dropped there

	
	getPositionMatrix(burst_cache){
		if(burst_cache || !this._matrix) {
			const bb = this.getBoundingClientRect();
			this._matrix.e = bb.left;
			this._matrix.f = bb.top;
		}
		return this._matrix;
	}
	
	connectedCallback(){
		
		super.connectedCallback();
		this.getPositionMatrix(true);
		this.querySelectorAll('words-tile').forEach( wt => {
			this.addWordTileSafe(wt);
		})
	}
	disconnectedCallback(){
		super.disconnectedCallback();
	}
	
	static initInteractions(){
		const instance = interact("tile-slot")
		.dropzone({
			// overlap: 0.75,
			ondrop: function (event) {
				event.relatedTarget.drop(event);
			},
			ondragenter: function (event) {
				const wordsTile = event.relatedTarget;
				event.target.classList.add('draghover')
		  },
			ondragleave: function (event) {
				const wordsTile = event.relatedTarget.wordsTile;
				const tile = event.target
				tile.classList.remove('draghover')
		  },
		})
		.on('dropactivate', function (event) {
			event.target.classList.add('drag_active')
		})
		.on('dropdeactivate', function (event) {
			event.target.classList.remove('drag_active')
			event.target.classList.remove('draghover')
		})
		
		window.addEventListener("resize", this.onresize )
		window.addEventListener("scrollend", this.onresize )
		
		return instance;
	}
	
	static onresize = function(event){
		
		clearTimeout(this._resizeThrottler);
		
		this._resizeThrottler = setTimeout( ()=>{
			this.instances.forEach( tileSlot =>{
				tileSlot.getPositionMatrix(true)
				tileSlot.wordsTiles.forEach( wordsTile => {
					wordsTile.updateTileSlotTransform();
				})
			})
		}
		, 
		100
		)
		
	}.bind(this)
	
	
	removeWordTile(wordsTile){
		this.wordsTiles = this.wordsTiles.filter(wt => wt !== wordsTile)
		this.reorganizeWordsTiles();
	}
	
	addWordTileSafe(wordsTile){
		
		if(this.victoryLock){
			wordsTile.updateTileSlotTransform();
			return;
		}
		
		let originTileSlot = wordsTile?._parentTileSlot;
		originTileSlot?.removeWordTile(wordsTile);
		
		wordsTile._parentTileSlot = this;
		wordsTile.i = this.index;
		wordsTile.setAttribute("i", this.index);
		wordsTile.updateTileSlotTransform();
	
		// Lost TileSlot can stack WordsTiles
		if(!this.isLost){
			// But other can't, so if this one already has a WordsTile inside it
			if(this.wordsTiles.length){
				this.wordsTiles[0].setFlying();
				originTileSlot.addWordTileSafe(this.wordsTiles[0]);
			}
		}
		this.wordsTiles.push(wordsTile);
		this.reorganizeWordsTiles();
		
	}
	
	reorganizeWordsTiles(){
		this.wordsTiles.forEach( (wt,index)=> wt.style.setProperty("--local-z-index", index) )
	}
	
	cycleWordsTiles(){
		const last = this.wordsTiles.pop();
		this.wordsTiles.unshift(last);
		this.reorganizeWordsTiles();
	}
	
}

class Player2WordsTileV2 extends WordTile{

	solution = {r : -1, i : -1};
	
	pastAttempts = new Set();
	
	_parentTileSlot = null;
	victoryLock = false;
	static identityMatrix = new DOMMatrix();
	
	dragMatrix = new DOMMatrix();
	tileMatrix = new DOMMatrix();

	
	localZIndex = 0;
	
	constructor(options){
		super(options);
		
		this.addEventListener('transitionend', (e)=>{
			if(e.propertyName === '--transform-tile'){
				this.resetZIndexRelatedClasses()
			}
		})				
			
		
	}
	
	
	saveStateAsAttempted(){
		if(this.i !== 0) this.pastAttempts.add(`${this.r}/${this.i}`);
	}
	checkAlreadyAttempted(){
		// debugger
		return this.pastAttempts.has(`${this.r}/${this.i}`);
	}
	autoSetClassLastAttempted(){
		this.classList.toggle("attempted_before", this.checkAlreadyAttempted());
	}
	
	
	saveVictoryState(){
		if(this.isIntruder()) return 0;
		else return +!!this.checkSolution();
	}
	
	isIntruder(){
		return this.solution.i === 0 ;
	}
	
	checkSolution(){
		return (
			(this.isIntruder() || this.solution.r === this.r)
			&& this.solution.i === this.i
		);
	}
	
	lockVictory(){
		if(this.isIntruder()) return; // never lockVictory an intruder, else it will get revealed
		this.classList.add("victory");
		this.victoryLock = true;
		this._parentTileSlot.victoryLock = true;
	}
	
	static initInteractions(){
		
		const instance = interact('words-tile')
		
		instance.draggable({
		  listeners: {
			start (event) {
				event.target.dragStart(event);
			},
			move (event) {
				event.target.dragMove(event);
			},
			end(event){
			  event.target.dragEnd(event);
			}
		  }
		  

		})
						
		instance.on('tap', function (event) {
			event.currentTarget.tap(event);
			event.preventDefault();
		})
						
					
		return instance;
	}

	tap(){
		this.rotateTap();
		this.autoSetClassLastAttempted();
		window.game?.saveGameState();
	}

	dragStart(event){
	  
	  this.resetZIndexRelatedClasses();
	  
	  // important to getComputedStyle BEFORE setting .drag 
	  // because .drag { transition: none; } and resets current transformation value
	  const style = getComputedStyle(this);
	  const original_position = style.getPropertyValue("--transform-drag");
	  
	  this.classList.add("drag");
	  this.dragMatrix = new DOMMatrix(original_position);

	}

	dragMove(event){
		this.dragMatrix.e += event.dx; // e = translateX
		this.dragMatrix.f += event.dy; // f = translateY
		StyleSetter.setMatrix(this,"--transform-drag", this.dragMatrix ); 
	}
	
	dragEnd(event){
		
		if(this._dropped){
			this._dropped = null;
			return;
		}
		
		this._parentTileSlot.cycleWordsTiles();
		this.classList.remove("drag"); 
		this.resetDragMatrix();
	}

	drop(event){
		
		this._dropped = true;
		this.setLastDropped();
		
		StyleSetter.setMatrix(this,"--transform-drag", this.constructor.identityMatrix ); 
		StyleSetter.setMatrix(this,"--transform-tile", 
			this.tileMatrix.multiply(this.dragMatrix)
		);
		
		// <-- also flushes css with getPropertyValue 
		const style = getComputedStyle(this); 
		style.getPropertyValue("--transform-tile");
		// also flushes css with getPropertyValue !-->
		
		this.classList.remove("drag");
		
		event.target.addWordTileSafe(this);
		this.autoSetClassLastAttempted();
		window.game?.saveGameState();
		
	}
	
	resetZIndexRelatedClasses(){
		this.classList.remove('drag')
		this.classList.remove('last-dropped')
		this.classList.remove('flying')
	}
	
	setFlying(){
		this.classList.add("flying");
	}
	
	setLastDropped(){
		document.querySelectorAll(".last-dropped")
		.forEach(x=>x.classList.remove("last-dropped"));
		this.classList.add("last-dropped");
	}
	
	setLastMoved(){
		return;
		document.querySelectorAll(".last-moved")
		.forEach(x=>x.classList.remove("last-moved"));
		this.classList.add("last-moved");
	}

	rotateTap(){
		this.incrementRotation();
	}
	
	unselect(){
		this.selected = false;
		this.classList.remove('selected')
	}
	
	reset(){
		TileSlotPlayer2.getByIndex(0).addWordTileSafe(this);
		this.classList.remove("attempted_before");
		this.setRotation(0);
	}
	
	updateTileSlotTransform(){
		if(!this._parentTileSlot) return;
		this.tileMatrix = this._parentTileSlot.getPositionMatrix();
		StyleSetter.setMatrix(this,"--transform-tile", this.tileMatrix);
	}
	
	resetDragMatrix(){
		this.dragMatrix = this.constructor.identityMatrix;
		StyleSetter.setMatrix(this,"--transform-drag", this.dragMatrix ); 
	}
	
	setState(r,i){
		i = i ?? 0;
		r = r ?? 0;
		TileSlot.getByIndex(i).addWordTileSafe(this);
		this.setRotation(r);
	}
	
}

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '/css/player2.css';
document.head.appendChild(link);

document.body.classList.remove("player1");
document.body.classList.add("player2");

customElements.define("words-tile", Player2WordsTileV2);
customElements.define("tile-slot", TileSlotPlayer2);




const game = await GamePlayer2.fromCompressed(
	Object.fromEntries([...new URLSearchParams(window.location.search)]).g
);

window.game = game;
game.initBoard();	



	

		


