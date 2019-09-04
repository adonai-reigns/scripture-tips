

var STBible = {
  
  
  searchUrl : 'https://www.biblegateway.com/passage/?search=ST_SEARCH_TOKEN&version=TLV',
  searchUrlToken : 'ST_SEARCH_TOKEN',
  
  initted : false,
  tokens : {},
  otBooks : [
    'Genesis',
	'Exodus',
	'Leviticus',
	'Numbers',
	'Deuteronomy',
	'Joshua',
	'Judges',
	'Ruth',
	'1 Samuel',
	'2 Samuel',
	'1 Kings',
	'2 Kings',
	'1 Chronicles',
	'2 Chronicles',
	'Ezra',
	'Nehemiah',
	'Esther',
	'Job',
	'Psalms',
	'Proverbs',
	'Ecclesiastes',
	'Songs',
	'Isaiah',
	'Jeremiah',
	'Lamentations',
	'Ezekiel',
	'Daniel',
	'Hosea',
	'Joel',
	'Amos',
	'Obadiah',
	'Jonah',
	'Micah',
	'Nahum',
	'Habakkuk',
	'Zephaniah',
	'Haggai',
	'Zechariah',
	'Malachi'
  ],
  ntBooks : [
    '1 John',
    '2 John',
    '3 John',
    'Matthew',
    'Mark',
    'Luke',
    'John',
    'Acts',
    'Romans',
    '1 Corinthians',
    '2 Corinthians',
    'Galatians',
    'Ephesians',
    'Philippians',
    'Colossians',
    '1 Thessalonians',
    '2 Thessalonians',
    '1 Timothy',
    '2 Timothy',
    'Titus',
    'Philemon',
    'Hebrews',
    'James',
    '1 Peter',
    '2 Peter',
    'Jude',
    'Revelation'
  ],
  
  singularBooks : [
    'Obadiah',
    'Jude',
    '3 John',
    '2 John',
    'Philemon'
  ],
  
  init : function(config){
    this.initted = true;
  },
  
  processText : function(text, options){
    if(!this.initted){
      throw "Bible class must be initialised before it will work.";
    }
    
    // we do no destruction to the original data
    var processedText = text;
    
    // a bit of a hack. Let us search for John's letters before the gospel of John
    processedText = processedText.replace(/1 John/g, this.tokenizeString('1 John'))
                                  .replace(/2 John/g, this.tokenizeString('2 John'))
                                  .replace(/3 John/g, this.tokenizeString('3 John'));
    
    var books = this.otBooks.concat(this.ntBooks);
    
    for(var i in books){
      var bookName = books[i];
      var bookToken = this.tokenizeString(bookName);
      var bookNameSearch = new RegExp(bookName, 'g');
      processedText = processedText.replace(bookNameSearch, bookToken);
      var searchPattern = this.createBooknameSearch(bookName, bookToken);
      
      var parentFunction = this;
      processedText = processedText.replace(searchPattern, function(match){
        var tokenSearch = new RegExp(bookToken, 'g');
        var detokenizedMatch = match.replace(tokenSearch, bookName);
        var url = parentFunction.buildUrl(detokenizedMatch, options);
        var replacementString;
        
        options.mode = 'WIKIML';
        
        switch(options.mode){
          case 'WIKIML':
            replacementString = '['+url+' '+detokenizedMatch+']';
            break;
            
          case 'BBCODE':
            replacementString = '[url="'+url+'"]'+detokenizedMatch+'[/url]';
            
            break;
            
          case 'HTML':
          default:
            options.html = options.html || {};
            var htmlClassname = (typeof options.html.linkClassname === 'undefined') ? '' : ' '+options.html.linkClassname;
            replacementString = '<a class="scripturetips-link'+htmlClassname+'" ';
            
            if(typeof options.html.target !== 'undefined'){
              replacementString += 'target="'+options.html.target+'" ';
            }
            
            if(typeof options.html.onlick !== 'undefined'){
              replacementString += 'onlick="'+options.html.onclick+'" ';
            }
            
            replacementString += 'href="'+url+'">'+detokenizedMatch+'</a>';
            
            break;
        }
        
        return replacementString;
      });
    }
    
    return processedText;
    
  },
  
  
  buildUrl : function(searchPhrase, options){
    return this.searchUrl.replace(this.searchUrlToken, encodeURI(searchPhrase), options);
  },
  
  
  createBooknameSearch(bookName, bookToken){
    return new RegExp('('+bookToken+'\\s[0-9]{1,3}[a-zA-Z]?[^a-zA-Z\.\,\(\)]*)', 'g');
  },
  
  
  tokenizeString : function(text){
    var token = this.hashString(text);
    this.tokens[token] = text;
    return token;
  },
  
  detokenizeString : function(token){
    return this.tokens[token];
  },
  
  hashString : function(text){
    var hash = 0;
    if(text.length === 0){
      return hash;
    }
    for(var i = 0; i < text.length; i++){
      var char = text.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
      hash = hash & hash; // Convert to 32bit integer
    }
    if(hash < 0){
      // convert to positive integer
      hash = 0-hash;
    }
    return 'STHASH'+hash+'HSAHTS';
  }
  
};
