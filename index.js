var currentPage=1;
    var totalPage,callChart;

    $(()=>{
        setTimeout(function(){
            $(".start-animation").hide('scale','slow');
            $("body").css('overflow', 'unset');
        },5000);



        jQuery(document).ready(function() {
            jQuery('.toggle-nav').click(function(e) {
                jQuery(this).toggleClass('active');
                jQuery('.menu ul').toggleClass('active');
        
                e.preventDefault();
            });
        });


        
        // inits
        $(".pages").hide();
        $("#dialog").dialog({
            autoOpen: false,
            show: {
                effect: "blind",
                duration: 1000
            },
            hide: {
                effect: "explode",
                duration: 1000
            }
        });
        $(".fav-list").accordion({active: true , collapsible: true , heightStyle: "content" , icons: {header: "ui-icon-star" , activeHeader: "ui-icon-star"}});
        createCardfromAPI();
        $(".glyphicon-chevron-left").hide();

         // event: click on next/previous page
        $(".glyphicon").click(function(){
        $(".fav-list").accordion({active: false});
        changePage(this,totalPage);
        });
    
        // event: open the favourite list
        $(".fav-list").click(function(){   
        $(".fav-list ul").html(favouriteListHTML()+`<button>SHOW</button>`);
        $(".fav-list  ul  li span").hide(); 
        // event: when mouse on one of the coin in the favourite list
        $(".fav-list  ul  li").mouseover(function(){
            $(`#${this.id}.card`).css("box-shadow","2px 2px black").css('background-color','#e1eaea');
            $(this).css("box-shadow","2px 2px black").css('background-color','grey').css("color","white");
            $(this.children[0]).show();    
            
            // event: click on the show button in the favourite list
            $(".fav-list  ul button").click(function(){
                var favouriteCoins=window.localStorage.getItem('favourite');
                favouriteCoins=JSON.parse(favouriteCoins);
                var str='';
                $.getJSON('https://api.coingecko.com/api/v3/coins/list',function(data){
                    for(var i=0;i<data.length;i++){
                        for(var c=0;c<favouriteCoins.length;c++){
                            if(favouriteCoins[c]==data[i].id){
                                str+=cardHTMLstring(data[i]);
                            }
                        }
                    }
                    $(".showArea").html(str);
                    setWidget();
                    $(".pages").hide();
                });
            })

            // event: click on X to remove the coin
            $(".fav-list  ul  li span").click(function(){
                $(".fav-list").accordion({active: false});
                var coinId=this.parentElement.id;
                $(`#${coinId}.card`).css("box-shadow","0px 0px").css('background-color','white');
                
                // change the coin object toggle to false and save in Local Storage
                var thisCoin=localStorage.getItem(coinId);
                thisCoin=JSON.parse(thisCoin);
                thisCoin.toggle=false;
                thisCoin=JSON.stringify(thisCoin);
                window.localStorage.setItem(coinId,thisCoin);
                
                // remove the coin id from the favourite array
                removeCoinFromArray(coinId);
                $(".fav-list ul").html(favouriteListHTML());
            
                // change the card toggle to 'off'
                $(`#${coinId}.card`).children().toggleCheckedState(false);
        });
    });
    // event: when the mouse out of the coin in the favourite list 
    $(".fav-list  ul  li").mouseout(function(){
        $(`#${this.id}.card`).css("box-shadow","0px 0px").css('background-color','white');
        $(this).css("box-shadow","0px 0px").css('background-color','white').css("color","black");
            $(this.children[0]).hide();
    })
        });
    
        // event: key up on the input search
        $("nav input").keyup(function(){
        $(".fav-list").accordion({active: false});
        $(".pages").hide();
        var input=$("nav input").val().toLowerCase();
        createCardfromAPI(input)
        });
    
        // navigation tabs
        // event:  click on the home navigation
        $($(".nav-item.home .nav-link")[0]).click(function(e){
            $(".nav-item .nav-link").removeClass('select');
            e.target.classList.add('select');
            clearInterval(callChart);
            
            // event: enable click on the Live Report navigation
            $($(".nav-item.live-report .nav-link")[0]).click(function(){
                $(".nav-item .nav-link").removeClass('select');
                e.target.classList.add('select');
                liveReport();
            });
            
            $("form input").css("opacity","1").prop("disabled",false);
            $("form button").css("opacity","1").prop("disabled",false);
            $(".fav-list").accordion({active: false});
            currentPage=1;
            $("nav input").val('');
            createCardfromAPI();
        });
    

        // event: click on the Live Report navigation
        $($(".nav-item.live-report")[0]).click(function(){
        liveReport();
        });

        // event: click on the About navigation
        $(".nav-item.about").click(function(){
        $("form input").css("opacity","0.2").prop("disabled",true);
        $("form button").css("opacity","0.2").prop("disabled",true);
        $(".fav-list").accordion({active: false});
        $(".pages").hide();
        clearInterval(callChart);
        
        // event: enable click on the Live Report navigation
        $($(".nav-item.live-report")[0]).click(function(){
        liveReport();
        });

        aboutHTMLString();
        });
    });
    
    class Coin{
        constructor(id,symbol,details,toggle,lastUpdate){
            this.id=id
            this.symbol=symbol
            this.details=details
            this.HTMLdetails=`<img src="${details.image}">
                     <b>1 ${id.toUpperCase()} = </b><p>${details.usd} $</p>
                     <b>1 ${id.toUpperCase()} = </b><p>${details.eur} €</p>
                     <b>1 ${id.toUpperCase()} = </b><p>${details.ils} ₪</p>`;;
            if(toggle==undefined){
                this.toggle=false
            }
            else{
                this.toggle=toggle
            }
            this.lastUpdate=new Date().getTime();
        }


    }

    class Point{
        constructor(value){
            this.x=new Date();
            this.y=value;
        }
    }

    class ChartCoin{
        constructor(name){
            this.name=name
            this.dataPoints=[]
            this.showInLegend= true
            this.type='line'
        }
        addPoint(point){
            this.dataPoints.push(point);
        }
    }

    // create all the coins cards in the show area
    function createCardfromAPI(search){
        
        // progress bar
        $(".showArea").html(`<div class="loader"><b>Loading...</b></div>`);

        var str="";
        $.getJSON('https://api.coingecko.com/api/v3/coins/list',function(data){
            
            // not found param 'search' in the call method
            if(search==null){
                // define start and end to the for loop
                start=(currentPage-1)*15;
                end=currentPage*15;
                totalPage=Math.ceil(data.length/15);
                if(end>data.length){
                    end=data.length;
                }

                // run on the data details
                for(var i=start;i<end;i++){
                    str+=cardHTMLstring(data[i]);
                }
                
                // show the pages navigation
                $(".pages span").html(`${currentPage} - ${Math.ceil(data.length/15)}`);
                $(".pages").show();
           
                // hide/show the previous page button
                if(currentPage==1){
                    $("glyphicon glyphicon-chevron-left").hide();
                }
                else{
                    $("glyphicon glyphicon-chevron-left").show();
                }
            }

            // found param 'search' in the call method
            else{
                // search the coin in the API response
                for(var i=0;i<data.length;i++){
                    if(data[i].symbol==search.toLowerCase()){
                        // only the coin id include the input value
                        str+=cardHTMLstring(data[i]);
                    }
                }
            }

            $(".showArea").html(str);

            setWidget();

});
    }

    // create the card's more info and save the coin object in the Local Storage
    function createMoreInfoCard(id,toggle){
        $(`#${id} .moreInfo .moreInfo-body`).html(`<div class="loader"><b>Loading...</b></div>`);
        var url=`https://api.coingecko.com/api/v3/coins/${id}`;
        $.getJSON(url,function(data){
            // save the Coin object in the Local Storage
            var coinDetails={image: data.image.small,
                             usd: data.market_data.current_price.usd.toString().slice(0,7),
                             eur: data.market_data.current_price.eur.toString().slice(0,7),
                             ils: data.market_data.current_price.ils.toString().slice(0,7)};
            var newMoreInfoCoin=new Coin(id,data.symbol,coinDetails,toggle);
            var coinDetailsString=JSON.stringify(newMoreInfoCoin);
            window.localStorage.setItem(id,coinDetailsString);
            
            // put the Coin object HTML in the moreInfo-body
            $(`#${id} .moreInfo .moreInfo-body`).html(newMoreInfoCoin.HTMLdetails);
        });
    }
    
    // return the card HTML string of 'coin'
    function cardHTMLstring(coin){
        var favouriteCoins=window.localStorage.getItem('favourite');
        favouriteCoins=JSON.parse(favouriteCoins);
        var flag=false;
        if(favouriteCoins!=undefined || favouriteCoins!=null){
            for(var i=0;i<favouriteCoins.length;i++){
                if(favouriteCoins[i]==coin.id)
                    flag=true;     
            }
        }

        var newCard=`
                <div class="card" id="${coin.id}">`;
                    if(flag==true)
                        newCard+=`<input type="checkbox" class="ToggleSwitchSample" checked />`
                    else
                        newCard+=`<input type="checkbox" class="ToggleSwitchSample" />`
                 newCard+=`<div class="body-card">
                     
                     <h3>${coin.symbol.toUpperCase()}</h3>
                     <p>${coin.name}</p>
                     <div class="accordion moreInfo">
                        <h3>More Info</h3>
                        <div class="moreInfo-body text-center"></div>
                     </div>
                 </div>
               </div>`;
        return newCard;
    }
    
    // return the favourite list HTML string, if not have favourite show introduction
    function favouriteListHTML(){
        var favouriteFromLocalStorage=JSON.parse(localStorage.getItem('favourite'));
        var str='';
        if(favouriteFromLocalStorage==null || favouriteFromLocalStorage.length==0){
            str+=`<p>Turn on the coin's toggle for add to the favourite</p>`;
        }
        else{
            for(var i=0;i<favouriteFromLocalStorage.length;i++){
                str+=`<li id="${favouriteFromLocalStorage[i]}">${favouriteFromLocalStorage[i].toUpperCase()}<span class="glyphicon glyphicon-remove"></span></li>`;
            }
            // str+=`<button>SHOW</button>`;
        }
        return str;
    }
    
    // remove the coin from the favourite coins array
    function removeCoinFromArray(coinID){
        var array=JSON.parse(localStorage.getItem('favourite'));
        var index;
        for(var i=0;i<array.length;i++){
            // find the location of the coin id in the array
            if(array[i]==coinID)
                index=i;
            }
            // remove the coin id from the favourite array
            if(index!=undefined)
                array.splice(index,1);
            
                    
            // save the favourite array in the Local Storage
            array=JSON.stringify(array);
            window.localStorage.setItem('favourite',array);
    }
    
    // add a new coin to the favourite coins array
    function pushCoinToArray(coinID){
        var array=JSON.parse(localStorage.getItem('favourite'));
         // save the coin id in the favourite array
         if(array==null){
            array=[coinID];
         }
         else{
            array.push(coinID);
         }
         // save the favourite array in the Local Storage
         array=JSON.stringify(array);
         localStorage.setItem('favourite',array);
    }
    
    // return the favourite coins compare string (for the API)
    function urlCompare(){
        var favouriteCoins=window.localStorage.getItem('favourite');
        favouriteCoins=JSON.parse(favouriteCoins);
        var compare='fsyms=';
        var dataArray=[];

        for(var i=0;i<favouriteCoins.length;i++){
            var coin=JSON.parse(localStorage.getItem(favouriteCoins[i]));
            compare+=`${coin.symbol.toUpperCase()},`;
        }
        return compare;
    }
    
    // filter chart function
    function toggleDataSeries(e) {
	if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
		e.dataSeries.visible = false;
	} else {
		e.dataSeries.visible = true;
	}
	e.chart.render();
}

    // chenge the current page and hide/show the next/previous buttons
    function changePage(selected,lastPage){
        if(selected.classList.contains('glyphicon-chevron-right')){
            currentPage++;
        }
        else if(selected.classList.contains('glyphicon-chevron-left')){
            currentPage--;
        }
        
        // show/hide button left/right
        if(currentPage>=lastPage){
            $(".glyphicon-chevron-right").hide();
            $(".glyphicon-chevron-left").show();
        }
        else if(currentPage<=1){
            $(".glyphicon-chevron-right").show();
            $(".glyphicon-chevron-left").hide();
        }
        else{
            $(".glyphicon-chevron-right").show();
            $(".glyphicon-chevron-left").show();
        }
        
        createCardfromAPI();
        
    }

    // build the Live Report page
    function liveReport(){
            $($(".nav-item.live-report")[0]).off('click');
            $("form input").css("opacity","0.2").prop("disabled",true);
            $("form button").css("opacity","0.2").prop("disabled",true);
            $(".fav-list").accordion({active: false});
            $(".pages").hide();
            $(".showArea").html(`<div class="loader"><b>Loading...</b></div>`);
            var favouriteCoins=window.localStorage.getItem('favourite');
            favouriteCoins=JSON.parse(favouriteCoins);
            
            var dataPoints = [];
            var coinsCompare=[];
    
            var favouriteCoins=JSON.parse(localStorage.getItem('favourite'));
    
            for(var i=0;i<favouriteCoins.length;i++){
                var coin=JSON.parse(localStorage.getItem(favouriteCoins[i]));
                coinsCompare.push(new ChartCoin(coin.symbol.toUpperCase()));
            }
    
            // chart settings
            var options = {
        title:{
            text: `${favouriteCoins.join(' , ').toUpperCase()} to USD`
        },
        axisX: {
            title: "Time"
        },
        axisY: {
            title: "Coin Value",
            titleFontColor: "#4F81BC",
            lineColor: "#4F81BC",
            labelFontColor: "#4F81BC",
            tickColor: "#4F81BC",
            includeZero: false
        },
        legend: {
            cursor: "pointer",
            itemclick: toggleDataSeries
        },
        data: coinsCompare
            };
            
            // get data from the API to the chart
            callChart=setInterval(()=>{
                var url=`https://min-api.cryptocompare.com/data/pricemulti?${urlCompare()}&tsyms=USD`;
                $.getJSON(url,function(data){
                    for(var i=0;i<coinsCompare.length;i++){
                        for(name in data){
                            if(name==coinsCompare[i].name){
                                coinsCompare[i].addPoint(new Point(data[name].USD));
                            }
                        }
                    }
                    $(".showArea").html('<div id="chartContainer" style="height: 300px; width: 100%;"></div>');
                    $("#chartContainer").CanvasJSChart(options);
                });
            },2000);
            
    }
    
    // show in the show area the about page
    function aboutHTMLString(){
        $(".showArea").html(`<div class="about container">
        <h1 class="text-center">About Me</h1>
        <div class="row">
            <img class="col-sm-4" src="https://s2.coinmarketcap.com/static/img/coins/200x200/1.png">
            <div class="col-sm-8">
                <h2>Virtual Coins</h2>
                <h4>
                    This application have three tabs navigation:
                </h4>
                <div class="row">
                    <div class="col-sm-1"></div>
                    <ul class="col-sm-11">
                        <li>
                            <h6 >HOME: </h6>
                            <div>
                                <p>show 2909 virtual coins in cards and their USD,EUR,ILS values.</p>
                                <p>It's possible to search specific coin according to his code name in the input area
                                    that appear on the navigation,</p>
                                <p>and there is a toggle switch to each coin, the selected coins will show in graph on
                                    the Live Report tab (possible maximum 5 coins).</p>
                            </div>
                        </li>
                        <li>
                            <h6 >Live Report: </h6>
                            <div>
                                <p>In this tab will appear a graph that show all the selected coins in USD values.</p>
                            </div>
                        </li>
                        <li>
                            <h6 >About: </h6>
                            <div>
                                <p>Description about the application.</p>
                            </div>
                        </li>
                    </ul>
                </div>
                <p class="float-right"><i class="glyphicon glyphicon-copyright-mark">copyright IdoLago</i></p>
            </div>
        </div>
    </div>`);
    }

    // set all the widgets of the cards
    function setWidget(){
        
            // start the toggle engine
            $(".ToggleSwitchSample").toggleSwitch();
            $(".ToggleSwitch").width('42').height('18').css({'position': 'absolute' , 'float': 'right' , 'top': '5px' , 'right':'5px'});
            
            // event: toggle change
            $(".ToggleSwitchSample").change(function(){
                
                $(".fav-list").accordion({active: false});
                var thisCoin=localStorage.getItem(this.parentElement.parentElement.id);
                var toggleStatus=this.checked;
                
                // save the coin object in the Local Storage or change the toggle if the coin allready saved
                if(thisCoin==null){
                    // coin is not exist in the Local Storage
                    createMoreInfoCard(this.parentElement.parentElement.id,toggleStatus);
                }
                else{
                    // coin is exist in the Local Storage

                    // change the coin's toggle
                    thisCoin=JSON.parse(thisCoin);
                    thisCoin.toggle=toggleStatus;
                    thisCoin=JSON.stringify(thisCoin);
                    window.localStorage.setItem(this.parentElement.parentElement.id,thisCoin);
                }
                // push/remove the coin id in the favourite array
                    if(toggleStatus==true){
                        // toggle 'on'
                        var fav_arr=JSON.parse(localStorage.getItem('favourite'));
                        if(fav_arr==null || fav_arr.length<5){
                            pushCoinToArray(this.parentElement.parentElement.id)
                            $(".fav-list ul").html(favouriteListHTML());
                        }
                        else{
                            // if there is allready 5 coins 
                            var newSelected=this.parentElement.parentElement.id;

                            $("#dialog > ul").html(favouriteListHTML());
                            $("#dialog ul li span").hide();
                            $("#dialog").dialog("open");

                            $("#dialog ul li").mouseover(function(){
                                $(`#${this.id}.card`).css("box-shadow","2px 2px black").css('background-color','#e1eaea');
                                $(this).css("box-shadow","2px 2px black").css('background-color','grey').css("color","white");
                                $(this.children[0]).show();
                                $(this).click(function(){
                                    // check if the coin selected to remove is axist in the current page
                                    if($(`#${this.id}.card`).length==0){
                                        removeCoinFromArray(this.id);
                                        var removeCoin=JSON.parse(localStorage.getItem(this.id));
                                        removeCoin.toggle=false;
                                    }
                                    else{
                                        $(`#${this.id}.card input`).toggleCheckedState(false);
                                    }
                                    var favouriteCoins=JSON.parse(localStorage.getItem('favourite'));
                                    var flag=false;
                                    for(var i=0;i<favouriteCoins.length;i++){
                                        if(favouriteCoins[i]==newSelected){
                                            flag=true;
                                        }
                                    }
                                    if(!flag){
                                        pushCoinToArray(newSelected);
                                    }
                                    $("#dialog").dialog("close");
                                });
                            });
                            $("#dialog ul li").mouseout(function(){
                                $(`#${this.id}.card`).css("box-shadow","0px 0px black").css('background-color','white');
                                $(this).css("box-shadow","0px 0px").css('background-color','white').css("color","black");
                                $(this.children[0]).hide();
                            });
                            $("body > div.ui-dialog > div.ui-dialog-titlebar > button").click(function(){
                                $($(`#${newSelected}.card`).children()[0]).toggleCheckedState(false);
                            })
                            
                        }
                    }
                    else{
                        // toggle 'off'
                        removeCoinFromArray(this.parentElement.parentElement.id);
                        $(".fav-list ul").html(favouriteListHTML());
                        
                    }
                });
            
            // start the more info accordion engine
            $(".accordion").accordion({active: true , collapsible: true , heightStyle: "content"});
            
            // event: click on the More Info card
            $(".moreInfo").click(function(){
                
                $(".fav-list").accordion({active: false});
                var cardId=this.parentElement.parentElement.id;
                var cardSave=localStorage.getItem(cardId);
                if(cardSave==null){
                    // not found the card id
                    createMoreInfoCard(cardId,false);
                }
                else{
                    // found the card id in the localStorage
                    cardSave=JSON.parse(cardSave);
                    var now=new Date().getTime();
                    if(cardSave.lastUpdate>=now-120000){
                        // last update less than 2 min ago
                        $(`#${cardId} .moreInfo .moreInfo-body`).html(cardSave.HTMLdetails);
                    }
                    // last update more than 2 min 
                    else if(cardSave.lastUpdate<now-120000){
                        if(cardSave.toggle==true)
                            createMoreInfoCard(cardId,true);
                        else
                            createMoreInfoCard(cardId,false);
                    }
                       
                }
    });

    } 
