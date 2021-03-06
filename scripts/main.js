var searchInput = document.getElementById('searchInput');
var searchBtn = document.getElementById('searchBtn');
var searchList = document.getElementById('searchList');
var favList = document.getElementById('favList');

var empty_star_icon_path = 'img/empty-star-icon.svg';
var star_icon_path = 'img/star-icon.svg';

var descriptions = [];
var items = [];
var searchedItemsIndex = [];
var favItemsIndex = [];

getDataFromAPI();

function getDataFromAPI(){
	var requestURL = 'https://secure.toronto.ca/cc_sr_v1/data/swm_waste_wizard_APR?limit=2000';
	var request = new XMLHttpRequest();
	request.open('GET', requestURL);
	request.responseType = 'json';
	request.send(null);

	request.onreadystatechange = function(event) {
	    if (this.readyState === XMLHttpRequest.DONE) {
	        if (this.status === 200) {
	            storeTorontoWasteData(request.response);
	            loadSavedItemsFromLocalStorage();
	        } else {
	        	console.log('Request status : %d (%s)', request.status, request.statusText);
				appendItem("Error occured when fetching the Toronto Waste Lookup Data, please try later.");
	        }
	    }
	};
}

function newItemHTML(name, description, itemID, favourite = false){
	let item = "<div class='item'><div class='itemTitle'><img type='image' src='{{favIcon}}' alt='Icons made by www.flaticon.com/authors/smashicons' class='favBtn' id='item{{itemID}}'><p>{{itemTitle}}</p></div><div class='itemDescription'>{{itemDescription}}</div></div>";

	item = item.replace('{{itemID}}', itemID); //item boxes annotated as 'itemXXX..'
	item = item.replace('{{favIcon}}', (favourite ? star_icon_path : empty_star_icon_path));
	item = item.replace('{{itemTitle}}', name);
	item = item.replace('{{itemDescription}}', description);
	return item;
}

function appendItem(item){
	searchList.innerHTML += item;
}

function appendFavourite(item){
	favList.innerHTML += item;
}

// Returns ID of an existing description, or assign one if it doesn't exist then return the new ID
function getDescriptionID(description){
	let id = descriptions.indexOf(description); // description already stored?
	if(id == -1){
		descriptions.push(description);
		return descriptions['length']-1;
	}
	else return id;
}

// Stores each line (as hashmap) of a JSON Object in an array
function storeTorontoWasteData(jsonObject){
	jsonObject.forEach(function(itemSet){
		let title = itemSet.title;
		let descID = getDescriptionID(itemSet['body']);
		let keywords = itemSet.keywords;

		items.push({'title': title, 'descriptionID': descID, 'keywords': keywords});
	});
}

function performSearch(){
	flushSearchList();
	let foundItems = 0;
	let input = searchInput.value;

	if(input['length'] == 0) appendItem("Please enter one or multiple keywords in order to perform a search.");
	else if(input['length'] < 3) appendItem("Please enter at least 3 letters in order to perform a search.");
	else{
		for(var i = 0; i < items.length; i++){
			if(items[i]['keywords'].includes(input)){
				foundItems++;
				searchedItemsIndex.push(i);
			}
		}

		if(foundItems == 0){
			flushSearchList();
			appendItem("No results were found for \"" + input + "\".");
		}
		else{ updateSearchList(); }
		updateFavList();
	}
}

function updateSearchList(){
	searchList.innerHTML = "";
	searchedItemsIndex.forEach(function(i){
		let item = items[i];
		let favourite = (favItemsIndex.includes(i));
		appendItem(newItemHTML(item.title, HTMLEscape(descriptions[item.descriptionID]), i, favourite));
		addSearchedItemListener();
	});
}

function updateFavList(){
	favList.innerHTML = "";
	favItemsIndex.forEach(function(i){
		let item = items[i];

		appendFavourite(newItemHTML(item.title, HTMLEscape(descriptions[item.descriptionID]), i, true));
		addFavItemListener();
	});
}

// catches saved items from local storage
function loadSavedItemsFromLocalStorage(){
	let savedItems = localStorage.getItem('savedItems');

	if(savedItems != null && savedItems != ""){
		favItemsIndex = savedItems.split(',').map(x => parseInt(x));
		updateFavList();
	}
}


// stores into local storage the saved favourites
function updateSavedItemsFromLocalStorage(newItem = false){
	let savedItems = localStorage.getItem("savedItems");

	if(savedItems != "" || savedItems != null || newItem){
		localStorage.setItem("savedItems", favItemsIndex.join(','));
	}
}

// -- Utils --
function flushSearchList(){
	searchedItemsIndex = [];
	searchList.innerHTML = ""; // flushes the previous items
}

// Decode "hard-coded" HTML string
function HTMLEscape(str) {
  var d = new DOMParser().parseFromString(str, "text/html");
  return d.documentElement.textContent;
}


// -- Listeners --

//User wants to ADD favourite
function addSearchedItemListener(){
	var searchedItemNodes = document.getElementById('searchList').children;
	for (var i = 0; i < searchedItemNodes.length; i++) {
		let starIcon = searchedItemNodes[i].firstChild.firstChild;
		starIcon.addEventListener('click', function(){
			if(starIcon.getAttribute('src') == empty_star_icon_path){
				this.src = star_icon_path;
				let id = this.getAttribute('id').slice(4);
				favItemsIndex.push(parseInt(id));

				updateSavedItemsFromLocalStorage(true);
				updateFavList();
			}
		});
	}
}

//User wants to REMOVE favourite
function addFavItemListener(){
	var searchedItemNodes = document.getElementById('favList').children;
	for (var i = 0; i < searchedItemNodes.length; i++) {
		let starIcon = searchedItemNodes[i].firstChild.firstChild;
		starIcon.addEventListener('click', function(){
			let id = this.getAttribute('id').slice(4);
			favItemsIndex = favItemsIndex.filter(x => x != parseInt(id));
			updateSavedItemsFromLocalStorage();
			updateSearchList();
			updateFavList();
		});
	}
}

function flushWhenEmpty(){
	if(searchInput.value['length'] == 0) flushSearchList();
}

function performSearchWithEnter(){
	searchInput.addEventListener("keyup", function(event) {
		if (event.keyCode === 13) { // Key 'Enter'
	    searchBtn.click();
	  }
	});
}
