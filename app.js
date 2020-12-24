//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', {useUnifiedTopology: true, useNewUrlParser: true});

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({
  name: "Practice Leetcode"
});

const item2 = new Item({
  name: "Web Development Tutorial"
});

const item3 = new Item({
  name: "Read CLRS"
})

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

const defaultItems = [item1, item2, item3];

Item.find({}, function(err, docs){
  if(err) {
    console.log(err);
  } else {
    if(docs.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if(err) {
          console.log(err);
        } else {
          console.log("successfully insert items");
        }
      });
    }
  }
});

app.get("/", function(req, res) {
  Item.find({}, function(err, docs){
    if(err) {
      console.log(err);
    } else {
        res.render("list", {listTitle: "Today", newListItems: docs});
    }
  });

});

app.get("/:listName", function(req, res){
  const listName = _.capitalize(req.params.listName);

  List.findOne({name: listName}, function(err, doc){
    if(!err) {
      if(!doc) {
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        //Show an existing list
        res.render("list", {listTitle: listName, newListItems: doc.items});
      }
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    //Getiing back List instance from the db query
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }

});

app.post("/delete", function(req, res){
  const removeId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(removeId, function(err){
      if(err) {
        console.log(err);
      } else {
        console.log("Remove and Item!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: removeId}}}, function(err, result){
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }

});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
