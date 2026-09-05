import {Game, WordTile,TileSlot } from "./system.js";
import {DictLoader} from "./dictloader.js";
import {Random, rangeFromZeroTo} from "./utils.js";



class GamePlayer1 extends Game{
	
	playerName = null;
	
	getPlayerName(){
		if(this.playerName !== null) return this.playerName;
		this.playerName = prompt(`Entre ton nom de joueur`) || 0;
		return this.playerName ;
	}

	async loadRandomWords(){

		const dictsIndex = await DictLoader.getIndex();
		
		const dicts = Object.values(dictsIndex.dictionaries);
		Random.shuffleArrayInPlace(dicts);
		const dict = dicts[0];
		
		const pages = Object.values(dict.pages);
		Random.shuffleArrayInPlace(pages);
		const page = pages[0];
		
		const wordsIndexInPage = rangeFromZeroTo(page.length);
		Random.shuffleArrayInPlace(wordsIndexInPage);
		const wordsIndex = wordsIndexInPage.slice(0,5);
		
		return wordsIndex.map( wi=> [dict.path, page.index, wi] )
	
	}
	
	async loadRandomDataIntoWordsTiles(){
		
		const randomWords = await this.loadRandomWords();
		const wordTiles = document.querySelectorAll("words-tile");
		
		
		wordTiles.forEach( (wt,i)=>{
			if(i === 0) wt.style.display = "none";
			wt.setAttribute("src", randomWords[i].join(",") );
			wt.setAttribute("r", Random.numberBetweenZeroAnd(4) );
			wt.setPosition(i);
		});
	}
	
	async submit(){
		super.submit();
		const serialized = this.toJSON().toString();
		const error = await this.constructor.inValidateSerialized(serialized);
		if( error ){ 
			alert("erreur :(" + "\n" + error.message);
			console.error(serialized);
			return;
		}
		
		const encoded = await this.encode()
		let url = new URL(window.location)
		let base = new URL(url.origin + url.pathname);
		base.searchParams.append("g", encoded);
		
		const linkshare_popup = document.getElementById("linkshare_popup");
		const linkshareanchor = document.getElementById("linkshareanchor");
		const linkshareanchorSMS = document.getElementById("linkshareanchor-sms");
		linkshare_popup.classList.add("open");
		linkshareanchor.href = base.href;
		linkshareanchorSMS.href=`sms:?&body=${base.href}`
	}
	
	static async inValidateSerialized(s){
		try{
			await this.fromSerialized(s);
			return false;
		}
		catch(err){
			return err;
		}
	}
	
	
	toJSON(){
		
		const tile_data = [...document.querySelectorAll("words-tile")].map(x=>x.toSerializable());
		Random.shuffleArrayInPlace(tile_data);
		const user_words = this.getUserInputs().reduce( (acc,tile_p1)=>{
			acc[tile_p1.index] = tile_p1.getUserWord();
			return acc;
		}, []);
		
		let player1Name = this.getPlayerName() || 0;
		
		return [
			player1Name, tile_data, user_words
		].flat(2)
	}
	
	
	initBoard(){
		super.initBoard();
		this.initUserInputs();
		this.loadRandomDataIntoWordsTiles();
	}
	
	initUserInputs(){
		this.getUserInputs().forEach( (tile_p1,i) =>{
			tile_p1.index = i;
			tile_p1.innerHTML = `<input class="p1input" type="text" placeholder="MOT"/>`
			const input = tile_p1.querySelector("input");
			input.addEventListener("change", ()=>{
				input.value = input.value.trim();
			})
			tile_p1.getUserWord =x=> input.value;
		});
	}
		
}



document.body.classList.remove("player2");
document.body.classList.add("player1");

customElements.define("tile-slot", TileSlot);
customElements.define("words-tile", WordTile);

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '/css/player1.css?a=1';
document.head.appendChild(link);


const currentGameInstance = new GamePlayer1();
currentGameInstance.initBoard();
