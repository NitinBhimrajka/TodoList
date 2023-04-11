//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todoListDB", {
  usenewUrlParser: true,
});

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcom to ToDoList",
});

const item2 = new Item({
  name: "Hit the + icon to save",
});

const item3 = new Item({
  name: "<-- Hit this icon to delete",
});

const defaultItem = [item1, item2, item3];

const listSchema = {
  name:String,
  items : [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length == 0) {
      Item.insertMany(defaultItem, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully Added");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:topic", function(req,res){
  const customListName = _.capitalize(req.params.topic);

  List.findOne({name : customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name: customListName,
          items: defaultItem
        });
      
        list.save();
        res.redirect("/" + customListName);
      }
      else{
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  })

 

});


app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  let  listName = req.body.list;
  if (listName) {  
       listName = listName.trim();   
      }

  const item = new Item({
    name: itemName,
  });

  if(listName === "Today")
 {
  item.save();
  res.redirect("/");
 }
 else{
  List.findOne({name : listName}, function(err,foundList){
    let x = foundList.items;
    x.push(item);
    foundList.save();
    res.redirect("/" + listName);
  });
 }
});

app.post("/delete", function (req, res) {
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkItemId, function (err) {
      if (!err) {
        console.log("Successfully deleted");
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull : {items :{_id:checkItemId}}},function(err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }
});


app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
