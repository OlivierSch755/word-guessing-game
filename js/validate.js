import {DictLoader} from "./dictloader.js";


class InvalidParameterException extends Error {
	parameter;
	constructor(message,parameter){
		super(message);
		this.parameter = parameter;
	}
}
	


class Validate{
	
	static ValidateWordsAddresses(w){
		const valid = Array.isArray(w) && w.length === 5 && w.every( DictLoader.ValidateWordEntry ) ;
		if(!valid) throw new InvalidParameterException("Invalid dictionary references", w );
	}
	
	// static ValidateWordsMappingIndexes(indexes){
		// const valid = Array.isArray(indexes)
		// && indexes.length === 5
		// && indexes.every( i => !isNaN(i) && i >= 0 && i <= 4 )
		// && indexes.reduce( (a,v)=> a += v , 0) === 10 // (1+2+3+4)
		
		// if(!valid) throw new InvalidParameterException("Invalid tiles positions", indexes );
	// }
	
	static ValidateWordsMappingRotations(rotations){
		const valid = Array.isArray(rotations)
		&& rotations.length === 5 
		&& rotations.every( r => !isNaN(r) && r >= 0 && r <= 3 )
		
		if(!valid) throw new InvalidParameterException("Invalid tiles rotations", rotations );
	}
	
	static ValidateUserWords(userWords, maxlength){
		const tester = /^[A-Za-zÀ-ÿ]+$/;
		const valid = Array.isArray(userWords)
		&& userWords.length === 4 
		&& userWords.every( w => 
			typeof w === "string" 
			&& w.length 
			&& w.length <= maxlength
			&& tester.test(w)
		);
		
		if(!valid) throw new InvalidParameterException("Invalid user words provided", userWords );
	}
	
}

export{Validate}