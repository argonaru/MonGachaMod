Game.name = "gachamod";

Game.onload = function(){
	let screen = new Screen('gacha_screen', "100%", "100%", true, false);
	Game.screen.add(screen);
	Game.functions.Init()
}

Game.afterdraw = function(){
	$("style#css_mod_frame_gachamod").attr("src", "../../../plugins/gachamod/main.css");
	$("#frame_gacha_screen").html(`<link rel="stylesheet" type="text/css" href="../../../plugins/gachamod/main.css">`+
		`<button id="gacha_open_button" onclick='RunFromGlobal("gachamod","ToggleGacha");'></button>`+
		`<div id="gacha_container">`+
		`<div id="gacha_battle_zone"></div>`+
		`<div id="gacha_main_screen"><div id="gacha_player_tab"></div><div></div></div>`+
		`<div id="gacha_tab_buttons">`+
		`<button style="background:url(../../../plugins/gachamod/assets/icons/battle.png);" onclick='RunFromGlobal("gachamod","SwitchScene",["battle"]);'></button>`+
		`<button style="background:url(../../../plugins/gachamod/assets/icons/shop.png);" onclick='RunFromGlobal("gachamod","SwitchScene",["shop"]);'></button>`+
		`<button style="background:url(../../../plugins/gachamod/assets/icons/craft.png);" onclick='RunFromGlobal("gachamod","SwitchScene",["craft"]);'></button>`+
		`<button style="background:url(../../../plugins/gachamod/assets/icons/party.png);" onclick='RunFromGlobal("gachamod","SwitchScene",["party"]);'></button>`+
		`<button style="background:url(../../../plugins/gachamod/assets/icons/collection.png);" onclick='RunFromGlobal("gachamod","SwitchScene",["collection"]);'></button>`+
		`</div>`+
		`</div>`);
	Game.functions.ToggleGacha();
	Game.functions.UpdatePlayerStats();
}

Game.functions = {
	UpdatePlayerStats(){
		$("#gacha_main_screen div#gacha_player_tab").html(function(){
			let innerHTML = "";
			innerHTML+= "<cont><img src='../../../plugins/gachamod/assets/icons/level.png'>"+ Game.global_vars.player.level +"</cont>";
			innerHTML+= "<cont><img src='../../../plugins/gachamod/assets/icons/energy.png'>"+ Game.global_vars.player.energy +"</cont>";
			innerHTML+= "<cont><img src='../../../plugins/gachamod/assets/icons/currency.png'>"+ Game.global_vars.player.currency +"</cont>";
			return innerHTML;
		});
	},
	ToggleGacha(){
		if(Game.global_vars.is_open){
			Game.global_vars.is_open = false;
			$("#gacha_container").hide();
		}else{
			Game.global_vars.is_open = true;
			$("#gacha_container").show();
		}
	},
	RandomIdentifier(){
		let string = Math.random().toString(36).substr(2, 13);
		while(Game.global_vars.randomidentifiers.indexOf(string) != -1){
			string = Math.random().toString(36).substr(2, 13);
		}
		return string;
	},
	Init(){
		let date = new Date();

		let get_new_cards = false;

		let new_func = function(){
			Game.global_vars.player = {
				"level" : 0,
				"energy" : 20,
				"currency" : 300
			}
			Game.global_vars.scene_dat.battle.highest_zone = 0;
			Game.global_vars.scene_dat.battle.highest_map = 0;
			Game.global_vars.time = date.getTime();
			try{
				Game.global_vars.cards = Game.functions.ApplyCardClass([
				Game.functions.GetCard("Britski Common"),
				Game.functions.GetCard("Britski Common")
				]);
			}catch(e){

			}
			get_new_cards = true;
		}

		try{
			$.getJSON(modAPI.path+"/plugins/gachamod/save.json", function(result, err){
				
				// if the file is empty
				if(err || Object.keys(result).length < 1){
					console.log("creating new save data");
					new_func();
				}else{
						//Game.global_vars = result;
						Game.global_vars.player = result.player;
						if(result.time != 0) Game.global_vars.player.energy += Math.floor((date.getTime() - result.time) / 360000) * 100;
						Game.global_vars.cards = Game.functions.ApplyCardClass(result.cards);
						Game.global_vars.time = date.getTime();
						Game.global_vars.scene_dat.battle.highest_map = result.highest_map;
						Game.global_vars.scene_dat.battle.highest_zone = result.highest_zone;
				}
			});
		}catch(e){
			new_func();
		}

		$.getJSON(modAPI.path+"/plugins/gachamod/data.json", function(result){
			Game.global_vars.card_dictionary = Game.functions.ApplyCardClass(result.waifus.concat(result.monsters).concat(result.items));
			Game.global_vars.recipes = result.recipes;
			Game.global_vars.monster_drops = result.monster_drops;
			if(get_new_cards){
				Game.global_vars.cards = Game.functions.ApplyCardClass([
				Game.functions.GetCard("Britski Common"),
				Game.functions.GetCard("Britski Common")
				]);
			}
		});
	},
	Save(){
		const fs = require('fs');
		fs.writeFile(modAPI.path+"/plugins/gachamod/save.json", JSON.stringify({
			"cards" : Game.global_vars.cards,
			"player" : Game.global_vars.player,
			"highest_map" : Game.global_vars.scene_dat.battle.highest_map,
			"highest_zone" : Game.global_vars.scene_dat.battle.highest_zone,
			"time" : Game.global_vars.time
		}), (err) => {
			if(err){
				throw "could not save gacha data :(";
			}else{
				console.log("data saved");
			}
		});
	},
	CardInCollection(identifier, param){
		for(let i = 0; i < Game.global_vars.cards.length; i++){
			if(Game.global_vars.cards[i].identifier == identifier){
				if(param){
					return i;
				}else{
					return {...Game.global_vars.cards[i]};
				}
			} 
		}
		return undefined;
	},
	CheckRepeats(array, state){
		let return_array = [];
		let count_dict = {};
		let keys = [];
		for(let i=0; i < array.length; i++){
			let index = keys.indexOf(array[i])
			if(index!=-1){
				count_dict[array[i]]+=1;
				return_array.push(count_dict[array[i]]);
			}else{
				return_array.push(1);
				keys.push(array[i]);
				count_dict[array[i]] = 1;
			}
		}
		if(state) return keys;
		return return_array;
	},
	GetCard(name){
		for(h in Game.global_vars.card_dictionary){
			if(Game.global_vars.card_dictionary[h].name == name){
				card = {...Game.global_vars.card_dictionary[h]};
				if(card.type == "waifu"){
					card.level = 1;
					card.exp = 0;
				}
				return card;
			} 
		}
		return undefined;
	},
	SwitchScene(scene){
		switch(scene){
			case "main":

			break;

			case "craft":
				Game.global_vars.scene_dat.current_mode = "craft";

					$("#gacha_main_screen").css('background','url(../../../plugins/gachamod/assets/screens/craft.png)');
					$("#gacha_battle_zone").html(function(){
						let innerHTML = "";
						innerHTML+= `<div class="card_inventory">`;
						for(i in Game.global_vars.cards){
							if(Game.global_vars.scene_dat.craft.current_selection.indexOf(Game.global_vars.cards[i].identifier) != -1){
								innerHTML+= `<div class="card_holder" val="1" onclick="RunFromGlobal('gachamod','UnselectCard',['${Game.global_vars.cards[i].identifier}', $(this).attr('val')]);">`;
								innerHTML+= Game.functions.CreateHTML("card", Game.global_vars.cards[i]);
								innerHTML+= `<div class="cover" style=""></div>`;
							}else{
								innerHTML+= `<div class="card_holder" val="0" onclick="RunFromGlobal('gachamod','SelectCard',['${Game.global_vars.cards[i].identifier}', $(this).attr('val')]);">`;
								innerHTML+= Game.functions.CreateHTML("card", Game.global_vars.cards[i]);
							}
							innerHTML+= `</div>`;
						}
						innerHTML+= `</div>`;
						return innerHTML;
					});


					$("#gacha_main_screen div:nth-child(2)").html(function(){
						let innerHTML = `<div id="craft_card_container"><div id="card_holder">`;
						let count_indexes = Game.functions.CheckRepeats(Game.global_vars.scene_dat.craft.current_selection)
						let length = Game.global_vars.scene_dat.craft.current_selection.length;
						for(let i = 0; i < 3; i++){
							if(i < length){
								let card = Game.functions.CardInCollection(Game.global_vars.scene_dat.craft.current_selection[i]);
								if(card == undefined) continue;
								innerHTML+= `<div class="card_holder" val="1" onclick="RunFromGlobal('gachamod','UnselectCard',['${card.identifier}', $(this).attr('val')]);">`;
								innerHTML+= Game.functions.CreateHTML("card", card);
								innerHTML+= "</div>";
							}
							innerHTML+= Game.functions.CreateHTML('blank_card');
						}
						innerHTML+= `</div><button onclick="RunFromGlobal('gachamod','CraftCard');" id="gacha_craft_button"> CRAFT </button></div>`;
						return innerHTML;
					});
			break;

			case "shop":

				Game.global_vars.scene_dat.current_mode = "shop";
				$("#gacha_main_screen").css('background','url(../../../plugins/gachamod/assets/screens/shop.png)');
				$("#gacha_battle_zone").html(function(){
					let innerHTML = "";
					let temp_cards = Game.global_vars.scene_dat.shop.player_cards.slice();
					innerHTML+= `<div class="card_inventory">`;
					for(i in Game.global_vars.cards){
						if(Game.global_vars.scene_dat.shop.player_cards.indexOf(Game.global_vars.cards[i].identifier) != -1){
							innerHTML+= `<div class="card_holder" val="1" onclick="RunFromGlobal('gachamod','UnselectCard',['${Game.global_vars.cards[i].identifier}', $(this).attr('val')]);">`;
							innerHTML+=Game.functions.CreateHTML("card", Game.global_vars.cards[i]);
							innerHTML+= `<div class="cover" style=""></div>`;
						}else{
							innerHTML+= `<div class="card_holder" val="0" onclick="RunFromGlobal('gachamod','SelectCard',['${Game.global_vars.cards[i].identifier}', $(this).attr('val')]);">`;
							innerHTML+=Game.functions.CreateHTML("card", Game.global_vars.cards[i]);
						}
						
						
						innerHTML+=`</div>`;
					}
					innerHTML+= `</div>`
					return innerHTML;
				});
				$("#gacha_main_screen div:nth-child(2)").html(function(){
					let innerHTML = `<div id="shopping_window">`;
					innerHTML+= `<div id="shopkeeper_inv">`;
					for(let i = 0; i < 8; i++){
						if(Game.global_vars.scene_dat.shop.shopkeeper_cards[i]){
							let card = Game.functions.GetCard(Game.global_vars.scene_dat.shop.shopkeeper_cards[i]);
							if(card == undefined) continue;
							innerHTML+= `<div class="card_holder" val="1" onclick="RunFromGlobal('gachamod','ViewCard',[${i}]);">`;
							innerHTML+= Game.functions.CreateHTML("card", card);
							innerHTML+= "</div>";
						}
					}
					innerHTML+= "</div>";

					innerHTML+= `<div id="player_inv">`;
					//let count_indexes = Game.functions.CheckRepeats(Game.global_vars.scene_dat.shop.player_cards);
					let total_sum = 0;
					for(let i = 0; i < 8; i++){
						if(Game.global_vars.scene_dat.shop.player_cards[i]){
							//let card = Game.functions.CardInCollection(Game.global_vars.scene_dat.shop.player_cards[i], count_indexes[i]);
							let card = Game.functions.CardInCollection(Game.global_vars.scene_dat.shop.player_cards[i]);
							if(card == undefined) continue;
							innerHTML+= `<div class="card_holder" val="1" onclick="RunFromGlobal('gachamod','UnselectCard',['${card.identifier}', $(this).attr('val')]);">`;
							innerHTML+= Game.functions.CreateHTML("card", card);
							innerHTML+= "</div>";
							total_sum += card.cost;
						}
					}
					innerHTML+= `</div>`;

					if(Game.global_vars.scene_dat.shop.card_in_view !=""){
						innerHTML+= `<div class="card_in_view">`;
						innerHTML+=	Game.functions.CreateHTML("card_with_cost", Game.functions.GetCard(Game.global_vars.scene_dat.shop.card_in_view));
						innerHTML+= `</div>`;

					}else{
						innerHTML+= `<div class="card_in_view">`;
						innerHTML+=	Game.functions.CreateHTML("blank_card");
						innerHTML+= `</div>`;
					}
					innerHTML+=`<div id="cost_balance">$${total_sum*0.8}.00</div>`;

					innerHTML+= `<button class="buy_button" onclick="RunFromGlobal('gachamod','BuyCard');">></button>`;
					innerHTML+= `<button class="sell_button" onclick="RunFromGlobal('gachamod','SellCards');"><</button>`;
					innerHTML+= `</div>`;
					return innerHTML;
				}());
			break;

			case "card_pack":
				Game.global_vars.scene_dat.current_mode = "card_pack";

			break;

			case "battle":
				Game.global_vars.scene_dat.current_mode = "battle";
				$("#gacha_main_screen").css('background','url(../../../plugins/gachamod/assets/screens/battle.png)');
				if(Game.global_vars.scene_dat.battle.in_battle){
					$("#gacha_battle_zone").html(function(){

						let innerHTML = `<div id="battle_map" style="background:url(../../../plugins/gachamod/assets/battle_maps/${Game.global_vars.scene_dat.battle.map % 5}.png);">`;
						innerHTML+= `<div id="gacha_battle_character_container">`;
						let sprite_style = [
										["top:80px;" ,"250px;"],
										["top:30px;" ,"170px;"],
										["top:130px;","130px;"],
										["top:40px;" ,"80px;" ],
										["top:100px;","30px;" ]
										]
						for( i in Game.global_vars.scene_dat.battle.waifus){
							if(i > 4) break;
							//Game.global_vars.scene_dat.battle.waifus[i].index = i;
							innerHTML+= Game.functions.CreateHTML("sprite", Game.global_vars.scene_dat.battle.waifus[i], [sprite_style[i][0]+"left:"+sprite_style[i][1]]);
						}
						innerHTML+=`</div>`;

						innerHTML+= `<div id="gacha_battle_enemy_container" style="right:0px;">`;
						for( i in Game.global_vars.scene_dat.battle.monsters){
							if(i > 4) break;
							//Game.global_vars.scene_dat.battle.monsters[i].index = i;
							innerHTML+= Game.functions.CreateHTML("sprite_monster", Game.global_vars.scene_dat.battle.monsters[i], [sprite_style[i][0]+"right:"+sprite_style[i][1]]);
						}
						innerHTML+=`</div>`;
						

						innerHTML+=`</div>`;
						return innerHTML;
					});
					$("#gacha_main_screen div:nth-child(2)").html(function(){
						let innerHTML = `<button id="escape_button" onclick="RunFromGlobal('gachamod','RunFromBattle');">Escape</button>`;

						return innerHTML;
					});

					Game.global_vars.scene_dat.battle.waifus[0].add_highlight();

				}else{

					$("#gacha_battle_zone").html(function(){
						let innerHTML = "";

						return innerHTML;
					});

					$("#gacha_main_screen div:nth-child(2)").html(function(){
						let innerHTML = `<div id="gacha_map" style="background:url(../../../plugins/gachamod/assets/maps/${Game.global_vars.scene_dat.battle.map % 5}.png);">`;
						let style_array = [ "top:  30px; left:  30px;",
											"top:  90px; left:  80px;",
											"top:  50px; left: 140px;",
											"top:  90px; left: 210px;",
											"top: 160px; left: 180px;",
											"top: 210px; left: 100px;",
											"top: 270px; left: 200px;",
											"top: 290px; left: 300px;",
											"top: 180px; left: 280px;",
											"top: 100px; left: 320px;",
											"top:  30px; left: 340px;",
											"top:  50px; left: 440px;",
											"top: 120px; left: 520px;",
											"top: 180px; left: 460px;",
											"top: 230px; left: 420px;",
											"top: 235px; left: 510px;"
											];
						for(h in style_array){
							if(Game.global_vars.scene_dat.battle.highest_map > Game.global_vars.scene_dat.battle.map || (Game.global_vars.scene_dat.battle.highest_map == Game.global_vars.scene_dat.battle.map && (Game.global_vars.scene_dat.battle.highest_zone > h || Game.global_vars.scene_dat.battle.highest_zone == 15))){
								innerHTML+= `<button onclick="RunFromGlobal('gachamod','StartBattle',[${h}]);" style="${style_array[h]}position:absolute;background:green;width:30px;height:30px;border-radius:30px;"></button>`;
							}else if(Game.global_vars.scene_dat.battle.highest_zone == h  && Game.global_vars.scene_dat.battle.highest_map == Game.global_vars.scene_dat.battle.map){
								innerHTML+= `<button onclick="RunFromGlobal('gachamod','StartBattle',[${h}]);" style="${style_array[h]}position:absolute;background:yellow;width:30px;height:30px;border-radius:30px;"></button>`;
							}else{
								innerHTML+= `<button onclick="RunFromGlobal('gachamod','StartBattle',[${h}]);" style="${style_array[h]}position:absolute;background:red;width:30px;height:30px;border-radius:30px;"></button>`;
							}
							//innerHTML+= `<button onclick="RunFromGlobal('gachamod','StartBattle',[${h}]);" style="${style_array[h]}position:absolute;background:${(Game.global_vars.scene_dat.battle.highest_zone - 1 < h && Game.global_vars.scene_dat.battle.highest_map <= Game.global_vars.scene_dat.battle.map) ? "red" : "green"};width:30px;height:30px;border-radius:30px;"></button>`;
						}
						if(Game.global_vars.scene_dat.battle.highest_map == Game.global_vars.scene_dat.battle.map && Game.global_vars.scene_dat.battle.highest_zone == 15){
							innerHTML+= `<button onclick="RunFromGlobal('gachamod','StartBattle',['boss']);" class="boss_button" style="background:yellow;height:45px;width:45px;border-radius:45px;bottom:20px;position:absolute;right:60px;"></button>`;
						}else{
							innerHTML+= `<button onclick="RunFromGlobal('gachamod','StartBattle',['boss']);" class="boss_button" style="height:45px;width:45px;border-radius:45px;bottom:20px;position:absolute;right:60px;"></button>`;
						}
						
						innerHTML+= `<button onclick="RunFromGlobal('gachamod','SwitchMap',['left'])"> < </button>`;
						innerHTML+= `<button onclick="RunFromGlobal('gachamod','SwitchMap',['right'])"> > </button>`;
						innerHTML+= `</div>`;

						return innerHTML;
					});
				}
			break;

			case "collection":
				Game.global_vars.scene_dat.current_mode = "collection";
				$("#gacha_main_screen").css('background','brown');
				$("#gacha_main_screen div:nth-child(2)").html('');
				$("#gacha_battle_zone").html('')

			break;

			case "win_battle":
				$("#gacha_main_screen div:nth-child(2)").html(function(){
					let innerHTML = `<div id="gacha_end_battle_screen"><div>Won The Battle</div>`;
					if(Game.global_vars.scene_dat.battle.is_boss){
						innerHTML+= `<button onclick="RunFromGlobal('gachamod','StartBattle',['zone']);"> REPLAY </button>`;
					}else{
						innerHTML+= `<button onclick="RunFromGlobal('gachamod','StartBattle',['${Game.global_vars.scene_dat.battle.zone}']);"> REPLAY </button>`;
					}
					innerHTML+=`</div>`;
					return innerHTML;
				});
			break;

			case "lost_battle":
				$("#gacha_main_screen div:nth-child(2)").html(function(){
					let innerHTML = `<div id="gacha_end_battle_screen"><div>Lost The Battle</div>`;
					if(Game.global_vars.scene_dat.battle.is_boss){
						innerHTML+= `<button onclick="RunFromGlobal('gachamod','StartBattle',['zone']);"> REPLAY </button>`;
					}else{
						innerHTML+= `<button onclick="RunFromGlobal('gachamod','StartBattle',['${Game.global_vars.scene_dat.battle.zone}']);"> REPLAY </button>`;
					}
					innerHTML+=`</div>`;
					return innerHTML;
				});
			break;

			case "party":
				Game.global_vars.scene_dat.current_mode = "party";
				$("#gacha_main_screen").css('background','url(../../../plugins/gachamod/assets/screens/party.png)');
				$("#gacha_battle_zone").html(function(){
						let innerHTML = "";
						innerHTML+= `<div class="card_inventory">`;
						for(i in Game.global_vars.cards){
							if(Game.global_vars.scene_dat.party.selection.indexOf(Game.global_vars.cards[i].identifier) != -1){
								innerHTML+= `<div class="card_holder" val="1" onclick="RunFromGlobal('gachamod','UnselectCard',['${Game.global_vars.cards[i].identifier}', $(this).attr('val')]);">`;
								innerHTML+= Game.functions.CreateHTML("card", Game.global_vars.cards[i]);
								innerHTML+= `<div class="cover" style=""></div>`;
							}else{
								innerHTML+= `<div class="card_holder" val="0" onclick="RunFromGlobal('gachamod','SelectCard',['${Game.global_vars.cards[i].identifier}', $(this).attr('val')]);">`;
								innerHTML+= Game.functions.CreateHTML("card", Game.global_vars.cards[i]);
							}
							innerHTML+= `</div>`;
						}
						innerHTML+= `</div>`;
						return innerHTML;
					});

				$("#gacha_main_screen div:nth-child(2)").html(function(){
					let innerHTML = `<div id="party_card_container"><div id="card_holder">`;
					let count_indexes = Game.global_vars.scene_dat.party.selection.slice();
					let length = Game.global_vars.scene_dat.party.selection.length;
					for(let i = 0; i < 5; i++){
						if(i < length){
							//let card = Game.functions.CardInCollection(Game.global_vars.scene_dat.party.selection[i], count_indexes[i]);
							let card = Game.functions.CardInCollection(Game.global_vars.scene_dat.party.selection[i]);
							//card = Game.global_vars.cards[count_indexes[i]];
							if(card == undefined) continue;
							innerHTML+= `<div class="card_holder" val="1" onclick="RunFromGlobal('gachamod','UnselectCard',['${card.identifier}', $(this).attr('val')]);">`;
							innerHTML+= Game.functions.CreateHTML("card", card);
							innerHTML+= "</div>";
						}
						innerHTML+= Game.functions.CreateHTML('blank_card');
					}//<button onclick="" id="gacha_party_save_button"> SAVE PARTY </button>
					innerHTML+= `</div></div>`;
					return innerHTML;
				});
			break;

			default:

			break;
		}
	},
	CreateHTML(type, data, style){
		switch(type){
			case "blank_card":
				return `<img val="_" class="blank_card" class="cards" >`;
			break;

			case "card":
				return `<img val="${data.name}" class="cards" src="../../../plugins/gachamod/assets/cards/${data.card_image}">`;
			break;

			case "card_with_cost":
				return `<img val="${data.name}" class="cards" src="../../../plugins/gachamod/assets/cards/${data.card_image}"><div>${data.cost}</div>`;
			break;

			case "sprite":
				return `<div onclick="RunFromGlobal('gachamod','ProgressBattleWaifus',[${data.index},'defend']);" class="gacha_sprite" index="${data.index}" style="${style[0]}"><img val="${data.name}" class="sprite_img" src="../../../plugins/gachamod/assets/sprites/${data.sprite}.png">`+
				function(){
					if(data.stats.health == 0){
						return "";
					}else if((data.current_health/data.stats.health) > 0.1){
						return `<div class="gacha_sprite_health"><div style="height:calc(100% - 4px);margin: 2px;width:calc(${(data.current_health/data.stats.health)*100}% - 4px);background:green;"></div>`;
					}else if((data.current_health/data.stats.health) > 0.4){
						return `<div class="gacha_sprite_health"><div style="height:calc(100% - 4px);margin: 2px;width:calc(${(data.current_health/data.stats.health)*100}% - 4px);background:yellow;"></div>`;
					}else{
						return `<div class="gacha_sprite_health"><div style="height:calc(100% - 4px);margin: 2px;width:calc(${(data.current_health/data.stats.health)*100}% - 4px);background:red;"></div>`;
					}
				}()+`</div></div>`;
			break;

			case "sprite_monster":
				return `<div onclick="RunFromGlobal('gachamod','ProgressBattleWaifus',[${data.index},'attack']);" class="gacha_sprite" index="${data.index}" style="${style[0]}"><img val="${data.name}" class="sprite_img" src="../../../plugins/gachamod/assets/monsters/${data.sprite}.png"><div class="gacha_sprite_health"><div style="width:calc(${(data.current_health/data.stats.health)*100}% - 4px);height:calc(100% - 4px);margin: 2px;background:${(((data.current_health/data.stats.health) > 0.1) ? "green" : "#3e0303")};"></div></div></div>`;
			break;

			default:
				return "";
			break;
		}
	},
	ApplyCardClass(cards){

		if(!cards || cards.length == 0) return [];
		return cards.map(function(card){

			if(card.type == "waifu"){
				let cost_rating_dictionary = {
					"S" : 3000,
					"A" : 1200,
					"B" : 1000,
					"C" : 700,
					"D" : 300,
					"E" : 20
				}
				card.cost = cost_rating_dictionary[card.rating] + 
							card.stats.strength * 5 +
							card.stats.accuracy * 5 +
							card.stats.evasion * 5 +
							card.stats.defense * 5 +
							card.stats.health * 5;
			}else if(card.type == "item"){
				let cost_rating_dictionary = {
					"S" : 3000,
					"A" : 1200,
					"B" : 1000,
					"C" : 700,
					"D" : 300,
					"E" : 200
				}
				card.cost = cost_rating_dictionary[card.rating];
			}

			if(card.exp == undefined) card.exp = 0;
			if(!card.level) card.level = 1;

			card.identifier = Game.functions.RandomIdentifier();
			return card;
		});
	},
	ApplyFightingCharacterClass(cards){
		if(!cards || cards.length == 0) return [];
		return cards.map(function(card, index_0){

			card.stats = {
				"strength" : card.stats.health 	+ Math.floor(card.stats.health * 0.8 * card.level),
				"accuracy" :card.stats.accuracy + Math.floor(card.stats.accuracy * 0.8 * card.level),
				"evasion" : card.stats.evasion 	+ Math.floor(card.stats.evasion * 0.8 * card.level),
				"defense" : card.stats.defense 	+ Math.floor(card.stats.defense * 0.8 * card.level),
				"health" : 	card.stats.health 	+ Math.floor(card.stats.health * 0.8 * card.level)
			}

			if(card.exp == undefined) card.exp = 0;

			card.highlight_next_sprite = function(num){
				if(this.type=="waifu"){
					$(`#gacha_battle_character_container .gacha_sprite:nth-child(${this.index % 5 + 1}) img.sprite_img`).css('border','#ffffff00 dotted 4px');
					$(`#gacha_battle_character_container .gacha_sprite:nth-child(${num % 5 + 1}) img.sprite_img`).css('border','#ca0a0a dotted 4px');
					return;
				} 
				if(this.type=="monster"){
					$(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${this.index % 5}) img.sprite_img`).css('border','#ffffff00 dotted 0px');
					$(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${num % 5}) img.sprite_img`).css('border','#ca0a0a dotted 4px');
				}
				
			}

			card.add_highlight = function(){
				if(this.type=="waifu"){
					$(`#gacha_battle_character_container .gacha_sprite:nth-child(${this.index + 1}) img.sprite_img`).css('border','#ca0a0a dotted 4px');
				} 
				if(this.type=="monster"){
					$(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${this.index + 1}) img.sprite_img`).css('border','#ca0a0a dotted 4px');
				}
			}

			card.remove_highlight = function(){
				if(this.type=="waifu"){
					$(`#gacha_battle_character_container .gacha_sprite:nth-child(${this.index + 1}) img.sprite_img`).css('border','#ffffff00 dotted 4px');
				} 
				if(this.type=="monster"){
					$(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${this.index + 1}) img.sprite_img`).css('border','#ffffff00 dotted 4px');
				}
			}

			card.attack = function(enemy){
				let DOM_elem;
				if(this.type=="waifu") DOM_elem = $(`#gacha_battle_character_container .gacha_sprite:nth-child(${this.index + 1}) img`);
				if(this.type=="monster") DOM_elem = $(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${this.index + 1}) img`);
				
				let old_src = DOM_elem.attr('src');
				switch(this.type){
					case "waifu":
						DOM_elem.attr('src',`../../../plugins/gachamod/assets/sprites/attack_${this.sprite}.png`).delay(600).attr('src', `../../../plugins/gachamod/assets/sprites/${this.sprite}.png`);
					break;

					case "monster":
						DOM_elem.attr('src',`../../../plugins/gachamod/assets/monsters/attack_${this.sprite}.png`).delay(600).attr('src', `../../../plugins/gachamod/assets/monsters/${this.sprite}.png`);
					break;

					default:
					break;
				}
				enemy.hit(this);
				if(enemy.type == "waifu") Game.global_vars.scene_dat.battle.waifus[enemy.index] = enemy;
				if(enemy.type == "monster") Game.global_vars.scene_dat.battle.monsters[enemy.index] = enemy;
			};

			card.hit = function(enemy){
				let DOM_elem;
				if(this.type=="waifu") DOM_elem = $(`#gacha_battle_character_container .gacha_sprite:nth-child(${this.index + 1}) img.sprite_img`);
				if(this.type=="monster") DOM_elem = $(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${this.index + 1}) img.sprite_img`);
				
				let old_src = DOM_elem.attr('src');
				switch(this.type){
					case "waifu":
						DOM_elem.attr('src',`../../../plugins/gachamod/assets/sprites/hit_${this.sprite}.png`).delay(600).attr('src', `../../../plugins/gachamod/assets/sprites/${this.sprite}.png`);
					break;

					case "monster":
						DOM_elem.attr('src',`../../../plugins/gachamod/assets/monsters/hit_${this.sprite}.png`).delay(600).attr('src', `../../../plugins/gachamod/assets/monsters/${this.sprite}.png`);
					break;

					default:
					break;
				}
				
				let attack_damage = Math.floor(enemy.stats.strength)*(Math.random()*0.5 + 0.5) - this.stats.defense;
				if(attack_damage < 0) attack_damage = 0;
				console.log(this.stats.accuracy);
				console.log(enemy.stats.evasion);
				if(Math.random() < 1/(1+Math.exp(-(enemy.stats.evasion - this.stats.accuracy))*0.14)){

					// block
					if(this.defending){
						this.blockText();
						this.update();
						return;
					}
					if(Math.random() < 0.1){ //crit attack
						attack_damage+= Math.floor(attack_damage * 0.2);
						this.critText(attack_damage);
					}else{
						this.attackedText(attack_damage);
					}
					this.current_health = (this.current_health > attack_damage) ? Math.floor(this.current_health - attack_damage) : 0;
				}else{
					this.missText();
				}
				this.update();
			};

			card.blockText = function(){
				let DOM_elem;
				let index = this.index;
				if(this.type=="waifu") DOM_elem = $(`#gacha_battle_character_container .gacha_sprite:nth-child(${this.index + 1})`);
				if(this.type=="monster") DOM_elem = $(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${this.index + 1})`);
				DOM_elem.prepend(`<img src="../../../plugins/gachamod/assets/effects/blocked.png" style="position:absolute;left:0;" effect="attacked">`);
				if(this.type=="waifu") setTimeout(function() { $(`#gacha_battle_character_container .gacha_sprite:nth-child(${index + 1}) img[effect="attacked"]`).remove(); }, 400);
				if(this.type=="monster") setTimeout(function() { $(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${index + 1}) img[effect="attacked"]`).remove(); }, 400);
			}

			card.missText = function(){
				let DOM_elem;
				let index = this.index;
				if(this.type=="waifu") DOM_elem = $(`#gacha_battle_character_container .gacha_sprite:nth-child(${this.index + 1})`);
				if(this.type=="monster") DOM_elem = $(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${this.index + 1})`);
				DOM_elem.prepend(`<img src="../../../plugins/gachamod/assets/effects/evaded.png" style="position:absolute;left:0;" effect="attacked">`);
				if(this.type=="waifu") setTimeout(function() { $(`#gacha_battle_character_container .gacha_sprite:nth-child(${index + 1}) img[effect="attacked"]`).remove(); }, 400);
				if(this.type=="monster") setTimeout(function() { $(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${index + 1}) img[effect="attacked"]`).remove(); }, 400);
			}

			card.attackedText = function(number){
				let DOM_elem;
				let index = this.index;
				if(this.type=="waifu") DOM_elem = $(`#gacha_battle_character_container .gacha_sprite:nth-child(${this.index + 1})`);
				if(this.type=="monster") DOM_elem = $(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${this.index + 1})`);
				DOM_elem.prepend(`<img src="../../../plugins/gachamod/assets/effects/attack.png" style="position:absolute;left:0;" effect="attacked">`);
				if(this.type=="waifu") setTimeout(function() { $(`#gacha_battle_character_container .gacha_sprite:nth-child(${index + 1}) img[effect="attacked"]`).remove(); }, 400);
				if(this.type=="monster") setTimeout(function() { $(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${index + 1}) img[effect="attacked"]`).remove(); }, 400);
			}

			card.critText = function(number){
				let DOM_elem;
				let index = this.index;
				if(this.type=="waifu") DOM_elem = $(`#gacha_battle_character_container .gacha_sprite:nth-child(${this.index + 1})`);
				if(this.type=="monster") DOM_elem = $(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${this.index + 1})`);
				DOM_elem.prepend(`<img src="../../../plugins/gachamod/assets/effects/crit.png" style="position:absolute;left:0;" effect="attacked">`);
				if(this.type=="waifu") setTimeout(function() { $(`#gacha_battle_character_container .gacha_sprite:nth-child(${index + 1}) img[effect="attacked"]`).remove(); }, 400);
				if(this.type=="monster") setTimeout(function() { $(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${index + 1}) img[effect="attacked"]`).remove(); }, 400);
			}

			card.update = function(){
				let DOM_elem;
				if(this.current_health == 0){
					if(this.type=="waifu") $(`#gacha_battle_character_container .gacha_sprite:nth-child(${this.index + 1}) .gacha_sprite_health`).remove();
					if(this.type=="monster") $(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${this.index + 1}) .gacha_sprite_health`).remove();
					//DOM_elem.css('width', `calc(100% - 4px)`).css('background', 'white');
					return;
				}
				if(this.type=="waifu") DOM_elem = $(`#gacha_battle_character_container .gacha_sprite:nth-child(${this.index + 1}) .gacha_sprite_health div`);
				if(this.type=="monster") DOM_elem = $(`#gacha_battle_enemy_container .gacha_sprite:nth-child(${this.index + 1}) .gacha_sprite_health div`);
				

				if(this.current_health > this.stats.health * 0.4){
					DOM_elem.css('background', 'green');
				}else if(this.current_health > this.stats.health * 0.2){
					DOM_elem.css('background', 'yellow');
				}else{
					DOM_elem.css('background', 'red');
				}
				DOM_elem.css('width', `calc(${(this.current_health / this.stats.health)*100}% - 4px)`);
			}

			card.index = index_0;

			card.turn_passed = false;

			card.defending = false;

			card.current_health = card.stats.health;

			return card;
		});
	},
	ProgressBattleWaifus(index_00, type){
		if(Game.global_vars.calculating) return;
		for(i in Game.global_vars.scene_dat.battle.waifus){
			Game.global_vars.scene_dat.battle.waifus[i].remove_highlight();
			if(Game.global_vars.scene_dat.battle.waifus[i].turn_passed || Game.global_vars.scene_dat.battle.waifus[i].current_health == 0){
				//Game.global_vars.scene_dat.battle.waifus[i].remove_highlight();
				//Game.global_vars.scene_dat.battle.waifus[i].highlight_next_sprite(i+1);
				continue;
			}
			Game.global_vars.scene_dat.battle.waifus[i].turn_passed = true;
			switch(type){
				case "defend":
					if(index_00 == i){
						Game.global_vars.scene_dat.battle.waifus[i].defending = true;
					} 
				break;

				case "attack":
					Game.global_vars.scene_dat.battle.waifus[i].attack(Game.global_vars.scene_dat.battle.monsters[index_00]);
				break;

				default:

				break;
			}
			//Game.global_vars.scene_dat.battle.waifus[i].remove_highlight();
			if(!((parseInt(i) + 1) % 5 == 0 || Game.global_vars.scene_dat.battle.waifus[(parseInt(i) + 1) % 5].name == "Empty")){
				Game.global_vars.scene_dat.battle.waifus[(parseInt(i) + 1)].add_highlight();
			}
			
			if(1 == Game.functions.CheckBattleState()){
				Game.functions.SwitchScene("win_battle");

				if(Game.global_vars.scene_dat.battle.highest_zone == Game.global_vars.scene_dat.battle.zone && Game.global_vars.scene_dat.battle.highest_map == Game.global_vars.scene_dat.battle.map){
					if(Game.global_vars.scene_dat.battle.is_boss){
						Game.global_vars.scene_dat.battle.highest_map+= 1;
						Game.global_vars.scene_dat.battle.highest_zone = 0;
					}else{
						Game.global_vars.scene_dat.battle.highest_zone+= 1;
						if(Game.global_vars.scene_dat.battle.highest_zone > 15){
							//Game.global_vars.scene_dat.battle.highest_map+=1;
							Game.global_vars.scene_dat.battle.highest_zone = 15
						}
					}
				}
				// give loot and xp

				let loot = [];
				let gain_xp = 0;
				let character_num = 5;
				for(n in Game.global_vars.scene_dat.battle.monsters){
					let monster_loot_array = Game.functions.GetLoot(Game.global_vars.scene_dat.battle.monsters[n].name);
					if(monster_loot_array.length > 0){
						loot.push(monster_loot_array[Math.floor(monster_loot_array.length * Math.random())]);
					}
					gain_xp += (Game.global_vars.scene_dat.battle.monsters[n].level**2 * 1) + 5;
				}

				Game.global_vars.scene_dat.battle.in_battle = false;
				//let loot = Game.global_vars.scene_dat.battle.loot.slice();
				for(c in loot){
					let new_card = Game.functions.GetCard(loot[c]);
					if(new_card != undefined){
						let state = false;
						switch(new_card.rating){
							case "A":
								state = ( 0.05 > Math.random());
							break;

							case "B":
								state = ( 0.1 > Math.random());
							break;

							case "C":
								state = ( 0.15 > Math.random());
							break;

							case "D":
								state = ( 0.3 > Math.random());
							break;

							case "E":
								state = ( 0.4 > Math.random());
							break;

							default:
								state = true;
							break;
						}
						if(state) Game.global_vars.cards.push(Game.functions.ApplyCardClass([new_card])[0]);
					} 
					Game.global_vars.scene_dat.battle.loot = [];
				}
				for(n in Game.global_vars.scene_dat.battle.waifus){
					if(Game.global_vars.scene_dat.battle.waifus[n].current_health == 0 || Game.global_vars.scene_dat.battle.waifus[n].name == "Empty"){
						character_num--;
					}
				}
				for(n in Game.global_vars.scene_dat.battle.waifus){
					Game.global_vars.scene_dat.battle.waifus[n].exp += Math.floor(gain_xp/character_num);
				}
				Game.functions.CheckWaifuExp();
				Game.global_vars.player.currency += (Game.global_vars.scene_dat.battle.difficulty * 100) + Math.floor(Math.random() * 100 * Game.global_vars.scene_dat.battle.zone);
				Game.functions.UpdatePlayerStats();
			}

			return;
		}
		
		Game.functions.ProgressAllMonsters();
		if(2 == Game.functions.CheckBattleState()){
			Game.functions.SwitchScene("lost_battle");
			Game.global_vars.scene_dat.battle.loot = [];
			Game.global_vars.scene_dat.battle.in_battle = false;
		}
		return;
	},
	GetLoot(name){
		for(i in Game.global_vars.monster_drops){
			if(Game.global_vars.monster_drops[i].monster == name){
				return Game.global_vars.monster_drops[i].drops;
			}
		}
		return ["Common Stick"];
	},
	CheckWaifuExp(){
		for(i in Game.global_vars.scene_dat.battle.waifus){
			if(Game.global_vars.scene_dat.battle.waifus[i].name == "Empty") continue;
			let index = Game.functions.CardInCollection(Game.global_vars.scene_dat.battle.waifus[i].identifier, true);
			console.log(Game.global_vars.scene_dat.battle.waifus[i].exp);
			console.log((Game.global_vars.scene_dat.battle.waifus[i].level**2) * 20);
			if(Game.global_vars.scene_dat.battle.waifus[i].exp >= (Game.global_vars.scene_dat.battle.waifus[i].level**2) * 20){
				console.log("character leveled up");
				if(index == undefined) continue;
				Game.global_vars.cards[index].level+=1;
				Game.global_vars.scene_dat.battle.waifus[i].level+=1;
				//Game.global_vars.scene_dat.battle.waifus[i].exp = Game.global_vars.scene_dat.battle.waifus[i].exp - (Game.global_vars.scene_dat.battle.waifus[i].level**2 * 20);
				Game.global_vars.scene_dat.battle.waifus[i].exp = 0;
				
			}
			Game.global_vars.cards[index].exp = Game.global_vars.scene_dat.battle.waifus[i].exp;
		}
		Game.functions.UpdatePlayerStats();
	},
	ProgressBattleMonsters(index_00){
		for(i in Game.global_vars.scene_dat.battle.monsters){
			if(Game.global_vars.scene_dat.battle.monsters[i].turn_passed || Game.global_vars.scene_dat.battle.monsters[i].current_health == 0){
				continue;
			}
			Game.global_vars.scene_dat.battle.monsters[i].turn_passed = true;
			//setTimeout(function(){
				Game.global_vars.scene_dat.battle.monsters[i].attack(Game.global_vars.scene_dat.battle.waifus[index_00]);
			//}, Math.random()*2000 + 1000);
			return;
		}
	},
	ProgressAllMonsters(){
		Game.global_vars.calculating = true;
		for(let i=0; i < 5; i++){
			Game.functions.ProgressBattleMonsters(Math.round(Math.random() * 4));
		}
		Game.global_vars.scene_dat.battle.waifus = Game.global_vars.scene_dat.battle.waifus.map(function(dat){
			dat.remove_highlight();
			dat.turn_passed = false;
			dat.defending = false;
			return dat;
		});
		for(i in Game.global_vars.scene_dat.battle.waifus){
			if(Game.global_vars.scene_dat.battle.waifus[i].current_health > 0){
				Game.global_vars.scene_dat.battle.waifus[i].add_highlight();
				break;
			}
		}
		Game.global_vars.scene_dat.battle.monsters = Game.global_vars.scene_dat.battle.monsters.map(function(dat){
			dat.turn_passed = false;
			return dat;
		});
		//Game.global_vars.scene_dat.battle.waifus[0].add_highlight();
		Game.global_vars.calculating = false;
	},
	SelectCard(identifier, val){
		if(val == "0"){
			switch(Game.global_vars.scene_dat.current_mode){
				case "shop":
					if(Game.global_vars.scene_dat.shop.player_cards.length > 7) return;
					if(Game.global_vars.scene_dat.shop.player_cards.indexOf(identifier) != -1) return;
					Game.global_vars.scene_dat.shop.player_cards.push(identifier);
					Game.functions.SwitchScene('shop');
					
				break;

				case "craft":
					if(Game.global_vars.scene_dat.craft.current_selection.length > 2) return;
					if(Game.global_vars.scene_dat.craft.current_selection.indexOf(identifier) != -1) return;
					Game.global_vars.scene_dat.craft.current_selection.push(identifier);
					Game.functions.SwitchScene('craft');
				break;

				case "party":
					if(Game.global_vars.scene_dat.party.selection.length > 4) return;
					if(Game.global_vars.scene_dat.party.selection.indexOf(identifier) != -1) return;
					if(Game.functions.CardInCollection(identifier).type != "waifu") return;
					Game.global_vars.scene_dat.party.selection.push(identifier);
					Game.functions.RefreshParty();
					Game.functions.SwitchScene('party');
				break;

				default:

				break;
			}
		}
	},
	UnselectCard(identifier, val){
		if(val != "1") return;
		switch(Game.global_vars.scene_dat.current_mode){
			case "shop":
				index = Game.global_vars.scene_dat.shop.player_cards.indexOf(identifier);
				if( index != -1){
					Game.global_vars.scene_dat.shop.player_cards.splice(index, 1);
				}
				Game.functions.SwitchScene('shop');
			break;

			case "craft":
				index = Game.global_vars.scene_dat.craft.current_selection.indexOf(identifier);
				if(index != -1){
					Game.global_vars.scene_dat.craft.current_selection.splice(index, 1);
				}
				Game.functions.SwitchScene('craft');
			break;

			case "party":
				index = Game.global_vars.scene_dat.party.selection.indexOf(identifier);
				if(index != -1){
					Game.global_vars.scene_dat.party.selection.splice(index, 1);
				}
				Game.functions.RefreshParty();
				Game.functions.SwitchScene('party');
			break;

			default:
			break;
		}
	},
	ViewCard(index){
		switch(Game.global_vars.scene_dat.current_mode){
			case "shop" :
				Game.global_vars.scene_dat.shop.card_in_view = Game.global_vars.scene_dat.shop.shopkeeper_cards[index];
				Game.functions.SwitchScene('shop');
			break;

			default:
			break;
		}
	},
	SellCards(){
		let cards = Game.global_vars.scene_dat.shop.player_cards.slice(0,8);
		let total = 0;
		for(h in cards){
			//let card = Game.functions.GetCard(cards[h]);
			let card = Game.functions.CardInCollection(cards[h]);
			if(cards[h] != undefined){
				total+= card.cost * 0.8;
				Game.functions.RemoveCardFromInventory(cards[h]);
			} 
		}
		Game.global_vars.player.currency += total;
		Game.global_vars.scene_dat.shop.player_cards = [];
		Game.functions.ResetAllInventories();
		Game.functions.SwitchScene('shop');
		Game.functions.UpdatePlayerStats();
	},
	BuyCard(){
		if(Game.global_vars.scene_dat.shop.card_in_view != ""){
			let card = Game.functions.GetCard(Game.global_vars.scene_dat.shop.card_in_view);
			if(card.cost > Game.global_vars.player.currency) return;
			Game.global_vars.player.currency -= card.cost;
			Game.global_vars.cards.push(Game.functions.ApplyCardClass([card])[0]);
			Game.global_vars.scene_dat.shop.shopkeeper_cards.splice(Game.global_vars.scene_dat.shop.shopkeeper_cards.indexOf(Game.global_vars.scene_dat.shop.card_in_view), 1);
			Game.global_vars.scene_dat.shop.card_in_view = "";
			Game.functions.SwitchScene('shop');
		}
		Game.functions.UpdatePlayerStats();
	},
	RemoveCardFromInventory(identifier){
		for(i in Game.global_vars.cards){
			if(Game.global_vars.cards[i].identifier == identifier){
				Game.global_vars.cards.splice(i, 1);
				return;
			}
		}
	},
	CraftCard(){
		let cards = Game.global_vars.scene_dat.craft.current_selection.slice(0,3).map(function(identifier){
			return Game.functions.CardInCollection(identifier);
		});
		let highest_val = 0;
		let final_result = ""
		for(recipe of Game.global_vars.recipes){
			if(recipe.requires.length > cards.length) continue;
			let temp_val = 0;
			if(function(){
				let requires = recipe.requires.slice(0,3);
				for(k in cards){
					let index = requires.indexOf(cards[k].name)
					if(index != -1){
						temp_val+=1;
						requires.splice(index, 1);
					}
				}
				return (temp_val > highest_val && recipe.requires.length == temp_val);
			}()){
				highest_val = temp_val;
				final_result = recipe.result;
				if(temp_val == 3) break;
			}
		}

		if(highest_val == 0 && final_result == ""){
			//add failure card
			Game.global_vars.cards.push(Game.functions.GetCard("Common Stick"));
			console.log("recipe failed");
		}else{
			//add result card
			let card = Game.functions.GetCard(final_result);
			let gh_level = 0;
			for(n in cards){
				if(cards[n].level){
					gh_level+= cards[n].level / 3;
				}else{
					gh_level+= 0.334
				}
			}
			card.level = Math.floor(gh_level);
			if(card) Game.global_vars.cards.push(card);
			console.log("recipe success");
		}

		for(h in cards){
			if( cards[h] != undefined) Game.functions.RemoveCardFromInventory(cards[h].identifier);
		}
		Game.functions.ResetAllInventories();
		Game.functions.DisplayItemScreen();
		//console.log(cards);
	},
	ResetAllInventories(){
		Game.global_vars.scene_dat.craft.current_selection = [];
		Game.global_vars.scene_dat.shop.player_cards = [];
	},
	DisplayItemScreen(){
		// do some fancy display, do later

		Game.functions.SwitchScene(Game.global_vars.scene_dat.current_mode);
	},
	StartBattle(zone){

		Game.functions.RefreshParty();

		if(zone == "boss" && Game.global_vars.scene_dat.battle.highest_zone < 15) return;

		if(zone == "boss" && Game.global_vars.scene_dat.battle.highest_zone == 15){
			Game.global_vars.scene_dat.battle.is_boss = true;
			Game.global_vars.scene_dat.battle.zone = 15;
			Game.global_vars.scene_dat.battle.in_battle = true;
			Game.global_vars.scene_dat.battle.monsters = Game.functions.ApplyFightingCharacterClass(Array.apply(null, Array(5)).map(function(){
				let card = Game.functions.GetCard("Crab");
				card.level = Game.global_vars.scene_dat.battle.difficulty * Math.floor(Math.random() * 3);
				return card;
			}));
			Game.functions.SwitchScene("battle");
			return;
		}

		if((zone > Game.global_vars.scene_dat.battle.highest_zone && Game.global_vars.scene_dat.battle.map == Game.global_vars.scene_dat.battle.highest_map) || zone < 0) return;
		Game.global_vars.scene_dat.battle.is_boss = false;
		Game.global_vars.scene_dat.battle.in_battle = true;
		Game.global_vars.scene_dat.battle.zone = zone;
		Game.global_vars.scene_dat.battle.monsters = Game.functions.ApplyFightingCharacterClass(Array.apply(null, Array(5)).map(function(){
			let card = Game.functions.GetCard("Crab");
			card.level = Game.global_vars.scene_dat.battle.difficulty * (Math.floor(Math.random() * 2) + 1);
			return card;
		}));
	
		Game.functions.SwitchScene("battle");
	},
	CheckBattleState(){
		let waifus_alive = false;
		let monsters_alive = false;
		for(i in Game.global_vars.scene_dat.battle.waifus){
			if(Game.global_vars.scene_dat.battle.waifus[i].current_health > 0){
				waifus_alive = true;
				break;
			}	
		}
		for(i in Game.global_vars.scene_dat.battle.monsters){
			if(Game.global_vars.scene_dat.battle.monsters[i].current_health > 0){
				monsters_alive = true;
				break;
			}	
		}
		if(!monsters_alive) return 1;
		if(!waifus_alive) return 2;
		return 0;
	},
	SwitchMap(direction){
		switch(direction){
			case "left":
				if(Game.global_vars.scene_dat.battle.map < 1) return;
				Game.global_vars.scene_dat.battle.map-=1;
				Game.global_vars.scene_dat.battle.difficulty-=1;
				Game.functions.SwitchScene('battle');
			break;

			case "right":
				if(Game.global_vars.scene_dat.battle.map + 1 > Game.global_vars.scene_dat.battle.highest_map) return;
				Game.global_vars.scene_dat.battle.map+=1;
				Game.global_vars.scene_dat.battle.difficulty+=1;
				Game.functions.SwitchScene('battle');
			break;

			default:
			break;
		}
	},
	RunFromBattle(){
		Game.global_vars.scene_dat.battle.in_battle = false;
		Game.functions.SwitchScene('battle');
	},
	RefreshParty(){
		let new_party = [];
		for(let i = 0; i < 5; i++){
			if(i < Game.global_vars.scene_dat.party.selection.length){
				new_party.push(Game.functions.CardInCollection(Game.global_vars.scene_dat.party.selection[i]))
			}else{
				new_party.push(Game.functions.GetCard("Empty"));
			}
		}
		Game.global_vars.scene_dat.battle.waifus = Game.functions.ApplyFightingCharacterClass(new_party);
		Game.global_vars.scene_dat.battle.is_boss = false;
		Game.global_vars.scene_dat.battle.in_battle = false;
	},
	RefreshShopInventory(){
		let shop_array = []
		for(let i = 0; i < 8; i++){
			let card = Game.global_vars.card_dictionary[Math.floor(Math.random() * Game.global_vars.card_dictionary.length)];
			console.log(card);
			if(card.type != "waifu" || card.name == "Empty") continue;

			shop_array.push(card.name);
		}
		Game.global_vars.scene_dat.shop.shopkeeper_cards = shop_array;
		if(Game.global_vars.scene_dat.current_mode == "shop") Game.functions.SwitchScene("shop");
	}
}

Game.onfixedupdate = function(){
	let date = new Date();
	if(date - Game.global_vars.time > 360000){
		Game.global_vars.time = date.getTime();
		Game.global_vars.player.energy += 100;
		Game.functions.RefreshShopInventory();
		console.log("gacha stuff updated");
		Game.functions.Save();
	}
}

Game.global_vars = {
	"calculating" : false,
	"recipes" : [],
	"monster_drops" : [],
	"inventory" : [],
	"cards" : [],
	"player" : {
					"level" : 0,
					"energy" : 300,
					"currency" : 1000
				},
	"scene_dat" : {
		"main" : {},
		"craft" : {
			"current_selection" : []
		},
		"shop" : {
			"shopkeeper_cards" : ["Britski Common","Britski Common","Britski Common R", "Common Stick"],
			"player_cards" : [],
			"card_in_view" : "Britski Common"
		},
		"card_packs" : {
			"card_pack_queue" : []
		},
		"battle" : {
			"map" : 0,
			'is_boss' : false,
			"zone" : 0,
			"highest_zone" : 0,
			"highest_map" : 0,
			"speed" : 1,
			"in_battle" : false,
			"difficulty" : 0,
			"current_stage" : 0,
			"backgrounds" : [],
			"waifus" : [],
			"monsters" : [],
			"loot" : []
		},
		"party" : {
			"selection" : []
		},
		"collection" : {
			"selected" : []
		},
		"current_mode" : "main"
	},
	"data" : {},
	"card_dictionary" : [],
	"time" : 0,
	"randomidentifiers" : [],
	"is_open" : true
}
