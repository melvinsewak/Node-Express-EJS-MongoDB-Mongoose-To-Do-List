//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
const { process_params } = require("express/lib/router");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

console.log(`Connection to database using: ${process.env.DB_CONNECTION_STRING}`);

mongoose.connect(process.env.DB_CONNECTION_STRING);

const itemSchema = new mongoose.Schema({
  name:{
    type: String,
    required:true
  }
});

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  items: [itemSchema]
});

const ItemModel = mongoose.model("item", itemSchema);

const ListModel = mongoose.model("list", listSchema);

const defaultItems = [
  new ItemModel({name: "Welcome to your todo list!"}),
  new ItemModel({name: "Hit + button to add a new item."}),
  new ItemModel({name: "<-- Hit this to delete an item"})
]

function seedDefaultList(items){ 
  
}

function seedCustomList(name, items){

  
}

app.get("/", function(req, res) {

  ItemModel.find({}, function(err, foundItems){

    if(foundItems && foundItems.length){
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    else{
      ItemModel.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log(`Successfully seeded database for default list`);
        }

        res.redirect('/');
      }); 
    }

  });

});

app.get("/:customListName", function (req, res){
  const name = _.capitalize(req.params.customListName);

  ListModel.findOne({name: name}, function(err, result){
    if(err){
      console.log('Error occurred while poscessing the request. Error details: ', err);
      res.send('Error occurred while poscessing the request.');
    }
    else{
        if(result && result.items && result.items.length){
          res.render("list", {listTitle: result.name, newListItems: result.items});
        }
        else{
          const list = new ListModel({
            name: name,
            items: defaultItems
          });
        
          ListModel.insertMany([list], function(err){
            if(err){
              console.log(err);
            }
            else{
              console.log(`Successfully seeded database for ${name} list`);
            }
          });
          res.redirect("/"+name);
        }
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const item = new ItemModel({name: req.body.newItem});
  
  if(listName === "Today"){
    item.save();
    res.redirect('/');
  }
  else{
    ListModel.findOne({name: listName}, function (err, result){
    if(err){
      console.log(err);
      res.send('Error')
    }
    else{
      result.items.push(item);
      result.save();
      res.redirect('/'+listName);
    }
      
    }); 
}

});

app.post("/delete", function(req, res){

  const itemId = req.body.itemId;
  const listName = req.body.list;

  console.log(listName, itemId);

  if(listName ==="Today"){
    ItemModel.findByIdAndRemove(itemId, function (err){
      if(err){
        console.log(err);
      }
      else{
        console.log(`Successfully deleted the checked item with id ${itemId}`);      
      }
      res.redirect('/');
    });
  }
  else{
    
    ListModel.findOneAndUpdate({name: listName},{$pull: {items: {_id: itemId}}}, function(err, result){
      if(err){
        console.log(err);
      }
      else{
        console.log(`Successfully deleted the checked item with id ${itemId}`);
      }
      res.redirect("/"+listName);
    });
  }



});

const port = process.env.PORT || 3000
app.listen(port, function() {
  console.log(`Server started on port ${port}`);
});
