import {rangeFromZeroTo} from "./utils.js";


class MissingWordEntryException extends Error {
	constructor(message,dictEntry){
		super(message);
		this.dictEntry = dictEntry;
	}
}


class DictLoader{

	static index;
	static ArrayIndex = [];
	
	static async getIndex(){
		if(this.index) return this.index;
	
		const loader = fetch("/dict/index.json")
		.then( req => req.json() )
		.then(resp=>{
			this.ArrayIndex = Object.values(resp.dictionaries).reduce( (D,dict,index)=>{
				D[dict.path] = dict.pages.reduce( (P,page,index)=>{
					P[page.index] = rangeFromZeroTo(page.length);
					return P;
				}, [])
				return D;
			},[]);
			
			return resp;
		})
		this.index = loader;
		return loader;
	}
	
	static async getArrayIndex(){
		await this.getIndex();
		return structuredClone(this.ArrayIndex);
	}


	
	static baseURI = "/dict";
	
	static cache = {};

	static async getDictPage(dict,page, signal){
		
		
		const cacheindex = `${dict}/${page}`;
		if(this.cache[cacheindex]) return this.cache[cacheindex];
		const loader = fetch(`${this.baseURI}/${cacheindex}.json`, {signal})
		.then( req => {
			return req.json()
		})
		.catch(err =>{
			if (err.name === 'AbortError') {
				console.log('Fetch aborted');
			} 
			else{
				throw err;
			}
		})
		
		this.cache[cacheindex] = loader;
		return loader;
		
	}	

	static ValidateWordEntry = function(arr){
		return (
			Array.isArray(arr)
			&& arr.length === 3 
			&& arr.every( this.ValidateNumberIndex )
		);
	}.bind(this);
	
	static ValidateNumberIndex(val){
		return !isNaN(val) && parseInt(val).toString().length === val.toString().length;
	}
}






class DictEntry{
	
	dict = -1;
	page = -1;
	index = -1;
	words = [];
	isSet = false;
	
	toJSON(){
		return [this.dict, this.page, this.index].map(x=>parseInt(x));
	}
	
	_abortController;
	
	abortLoad(){
		if (this._abortController) {
			this._abortController.abort();
		}
	}
	
	async set(dict,page,index){
		this.isSet = false;
		this.abortLoad();
		this.dict = dict;
		this.page = page;
		this.index = index;
		await this.validate();
		this.isSet = true;
		return this.load();
		
	}
	
	
	async validate(){
		const arrayIndex = await DictLoader.getArrayIndex();
		if ( undefined === arrayIndex[this.dict][this.page][this.index] ){
			throw new MissingWordEntryException("Trying to load a word entry that does not exist in the dictionary index", this);
		}
	}
	
	async load(){
		if(!this.isSet) return null;
		this._abortController = new AbortController();
		const { signal } = this._abortController;
		
		const dict = await DictLoader.getDictPage(this.dict, this.page);
		this.words = dict[this.index];
		return this.words;
	}
	
}


window.DictEntry = DictEntry;
window.DictLoader = DictLoader;
export {DictLoader,DictEntry}
