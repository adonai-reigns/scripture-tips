var STContentApp = {
  
  // system properties - overwritten at runtime
  BibleServices : null,
  BibleSearchUrl : "",
  BibleDefaultTranslation : "",
  scriptureTipsOptions : {},
  
  // elements that do not get processed
  excludedTags : ['A', 'TEXTAREA', 'HEAD', 'INPUT', 'IFRAME', 'SCRIPT', 'META', 'HEAD', 
    'TIME', 'UL', 'HTML', 'BODY', 'TITLE', 'LINK', 'STYLE', 'IMG', 'BR', 'BLOCKQUOTE',
    'B', 'STRONG', 'I', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'FORM'],
  
  // for debugging
  countedList : {},
  
  init : function(){
    
    this.scriptureTipsOptions = {
      scriptures : [
        {
          name : 'Bible',
          searchUrl : STContentApp.BibleSearchUrl,
          translation : STContentApp.BibleDefaultTranslation,
          htmlOptions : {
            target : "_blank",
            title : "(Link Created by Scripture Tips)"
          }
        } // @TODO: Quoran, Vedas
      ],
      options : {
        mode : 'HTML'
      }

    };
    
    ScriptureTips.init({});
    
    chrome.runtime.sendMessage({name : 'getSTBackgroundAppData'}, function(STBackgroundAppData){

      if(STBackgroundAppData.tipDisabledDomains.indexOf(window.location.hostname)>-1){
        // we do not process this page (silently falls-through)
        

      }else{

        chrome.storage.sync.get('BibleServices', function(dbResult){
          
          STContentApp.BibleServices = dbResult.BibleServices;
          
          chrome.storage.sync.get('defaultBibleService', function(dbResult){
            // let's hang on to the configuration settings for forming the urls.
            STContentApp.BibleSearchUrl = STContentApp.BibleServices[dbResult.defaultBibleService].u;
            STContentApp.BibleDefaultTranslation = STContentApp.BibleServices[dbResult.defaultBibleService].t;

            // run on the whole page to begin with
            //var allTags = document.getElementsByTagName('*'); // non-jQuery (heavy, slow)
            
            // let's grab every node that can contain scripture references, and that doesn't have child nodes
            var allTags = $('li, div:not(:has(*))').get();
            
            for(var i = 0; i<allTags.length; i++){
              STContentApp.processNode(allTags[i]);
            };

            // watch for events - every time the page is modified, add the links on the new content
            var mutationObserver = new MutationObserver(function(mutations){
              
              mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node){
                    STContentApp.processNode(node);
                });
              });
            
            });

            mutationObserver.observe(document.body, { 
              characterData: true, 
              attributes: true, 
              childList: true, 
              subtree: true, 
              attributeFilter: ["data-scripturetips-processed"] 
            });

          });

        });

      }

    });

  },
  
  
  
  
  
  
  processNode : function(node){
    
    if(node.dataScripturetipsProcessed > 0){
      // not going to process it a second time
      return;
    }
    if(STContentApp.excludedTags.indexOf(node.tagName) > -1){
      // we exclude processing on elements that do not carry scripture references
      return;
    }
    
    if(!ScriptureTips.preProcessValidation(node.innerHTML, STContentApp.scriptureTipsOptions)){
      // we do not process this node because it does not contain scripture references
      node.dataScripturetipsProcessed = "1";
      return;
    }
    
    // for debugging
    if(typeof STContentApp.countedList[node.tagName] === 'undefined'){
      STContentApp.countedList[node.tagName] = 0;
    }
    STContentApp.countedList[node.tagName]++;
    // end for debugging
    
    // if it's a text node, so we don't want any trouble!
    var numChildren = 0;
    
    if(typeof node.children !== 'undefined'){
      var numChildren = node.children.length*1;
    }
    
    if(numChildren > 0){
      // operate on child nodes independently, so as to not overwrite dynamically created event listeners when overwriting innerHTML

      for(var i =0; i<node.children.length; i++){
        STContentApp.processNode(node.children[i]);
      }

      node.dataScripturetipsProcessed = "1";
      
    }else{
      // this node has no child nodes
      
      if(typeof node.innerHTML !== 'undefined'){

        node.dataScripturetipsProcessed = "1";

        var newContent = ScriptureTips.processText(node.innerHTML, STContentApp.scriptureTipsOptions);

        if(newContent !== node.innerHTML){
          // only update the dom if we are changing the content
          node.innerHTML = newContent;
        }

      };
    }
    
  }
  
};



// run the app
STContentApp.init();


