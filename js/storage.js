
class LocalStorage{
	
	static isBroken = false;
	
	
	static saveGameState(key,object){
		
		if(this.isBroken) return false;
		try{
			const serialized = JSON.stringify(object);
			return localStorage.setItem(key,serialized )
		}
		catch(err){
			this.isBroken = true;
			return false;
		}
	}
	
	static loadGameState(key){
		
		if(this.isBroken) return null;
		let state = null;
		
		try{
			state = localStorage.getItem(key);
		}
		catch(err){
			this.isBroken = true;
		}
		if(!state) return null;
		
		
		try{
			state = JSON.parse(state);
		}
		catch(err){
			state = null;
			this.deleteGameState(key);
		}
		return state;
	}
	
	static deleteGameState(key){
		localStorage.removeItem(key)
	}
}

var LocalMemory = LocalStorage;

export {LocalMemory}

