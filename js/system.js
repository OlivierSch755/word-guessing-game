import {Compressor} from "/js/compressor.js";
import {DictLoader,DictEntry} from "/js/dictloader.js";
import {Validate} from "/js/validate.js";


class Game {
	
	baseData = null;
	
	static maxUserWordLength = 20;
	
	async encode(){
		return Compressor.encode(this.toJSON().toString());
	}
	
	static async fromCompressed(compressed){
		const serialized = await Compressor.decode(compressed);
		const instance = await this.fromSerialized(serialized);
		instance.id = compressed;
		console.log(instance)
		return instance;
	}
	
	static async deserialize(s){
		const sp = s.split(',');
		const ds = {};
		ds.name = sp[0];
		
		
		const wordsData = sp.slice(1,26).reduce( (a,v, i)=> {
			let index = ~~(i/5);
			let subindex = i%5;
			a[index] = a[index] ?? [];
			a[index][subindex] = parseInt(v);
			return a;
		} , [])
		.map( array =>({
			address : array.slice(0,3),
			r : array[3],
			i : array[4]
		}))
		
		ds.wordsData = wordsData;
		
		const userWords = sp.slice(26,30)
		ds.userWords = userWords;
		return ds;
	}
	
	static async fromSerialized(serialized){
		
		const {name, wordsData, userWords } = await this.deserialize(serialized);

		Validate.ValidateUserWords(userWords, this.maxUserWordLength);
		Validate.ValidateWordsMappingRotations(wordsData.map(x=>x.r));
		Validate.ValidateWordsAddresses(wordsData.map(x=>x.address));
		
		const instance = new this();
		instance.baseData = {name, wordsData, userWords } ;
		instance.player1Name = name;
		return instance ;
	}
	
	initBoard(){
		this.initMenuButton();
	}
	
	initMenuButton(){
		const validationButton = document.querySelector("button.menu");
		validationButton.addEventListener("click", x=>this.submit(x) )
	}
	
	submit(e){
		
	}
	
	getUserInputs(){
		return [
			document.getElementById("user_top"),
			document.getElementById("user_right"),
			document.getElementById("user_bottom"),
			document.getElementById("user_left")
		];
	}
	
}




class TileSlot extends HTMLElement{
	
	_index = 0;
	isLost = true;
	
	static instances = [];
	
	static initInteractions(){}; 
	
	static observedAttributes = ["index"];
	attributeChangedCallback(name, oldValue, newValue) {
		switch(name){
			case "index" : 
				this.setIndex(newValue);
			break;
		}
	}
	
	constructor(){
		super();
	}
	
	static getByIndex(i){
		return document.querySelector( `tile-slot[index='${i}']` )
	}
	
	addWordTile(wordTile){
		this.append(wordTile);
	}
	
	setIndex(i){
		this._index = parseInt(i);
		this.isLost = (this._index === 0);
	}
	
	get index(){
		return this._index;
	}
	
	connectedCallback(){
		this.constructor.instances.push(this);
	}
	disconnectedCallback(){
		this.constructor.instances = this.constructor.instances.filter(tileSlot => tileSlot != this);
	}
	
}


class WordTile extends HTMLElement{
	
	dictEntry = new DictEntry();

	toJSON(){
		return ({
			i: this.i,
			r: this.r,
			d: this.dictEntry.toJSON()
		});
	}
	
	toSerializable(){
		return [...this.dictEntry.toJSON(), this.r, this.i]
	}
	
	
	i = 0;
	r = 0;
	
	template = document.getElementById("WORDS");
	
	static observedAttributes = ["i", "r", "src"];
	attributeChangedCallback(name, oldValue, newValue) {
		
		switch(name){
			case "i" :
			break;
			case "r" :
				this[name] = parseInt(newValue);
			break;
			case "src" :
				this.dictEntry.set(...newValue.split(','))
				.then( words => {
					this.setWords(...words);
				})
				.catch(err=>{
					this.setWords("404","404","404","404");
					// prévoir clean up si le chargement du mot a fail
				})
			break;
		}
	}
	
	
	constructor(){
		super();
		const shadow = this.attachShadow({mode:"open"});
		shadow.append(this.template.content.cloneNode(true));
	}
	
	connectedCallback(){

	}
	
	setRotation(r){
		this.setAttribute("r", r % 4);
	}
	
	incrementRotation(){
		this.setRotation(this.r + 1 );
	}
	
	setWords(w1,w2,w3,w4){
		[w1,w2,w3,w4].forEach( (word, index) =>{
			this.shadowRoot.querySelector(`.w${index + 1} > span > span`).innerText = word; 
		})
	}
	
	
	setPosition(i){
		this.i = i;
		this.setAttribute("i", i);
		TileSlot.getByIndex(i).addWordTile(this);
	}
}


Game.ready = Promise.all([
	DictLoader.getIndex()
]);

export {Game, WordTile, TileSlot};