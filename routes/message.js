var express = require('express');
var router = express.Router();
const moment = require('moment');

const message = require('../db/conn');

/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    const collection = await message.connectToMongodb();

    const response = await collection.find({status: 2}).toArray();

    return res.json({messages: response});
  } catch (err) {
    console.log(err);
    return res.status(500).json({status: 500, msg: "Internal server error"});
  } finally {
    message.closeDb();
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const collection = await message.connectToMongodb();

    const response = await collection.findOne({}, {$and: [
      {'_id': req.params.id},
      {'status': 2}
    ]});

    return res.json({message: response});
  } catch (err) {
    return res.status(500).json({status: 500, msg: "Internal server error"});
  } finally {
    message.closeDb();
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const collection = await message.connectToMongodb();

    const response = await collection.deleteOne({}, { '_id': req.params.id });

    if (response.deletedCount >= 1) {
      return res.json({status: 1});
    } else {
      return res.json({status: 0});
    }
  } catch (err) {
    return res.status(500).json({status: 500, msg: "Internal server error"});
  } finally {
    message.closeDb();
  }
});

router.post('/', async (req, res, next) => {
  try {
    const id = req.body.hash_id;
  
    const collection = await message.connectToMongodb();

    if (id) {
      const filter = { '_id': id };
      console.log(filter);
      const data = await collection.findOne({}, filter);
      
      if (data.status === 2) {
        return res.json({status: -2});
      } else if (data.status === 1) {
        const message = req.body.response;
        const yes_response = ["y", "yes", "yeah", "yup", "ok", "okey", "sure", "uh-huh"].includes(message);
        const no_response = ["n", "no", "nah"].includes(message);

        const value = { $set: { status: 2 }};
        await collection.updateOne({'_id': data._id} , value);
        if (yes_response) {
          const diff = moment(new Date(), "YYYY-MM-DD").diff(moment(data.birth_day, "YYYY-MM-DD"));
          
          return res.json({msg: `There are ${diff} days left until your next birthday` });
        } else if (no_response){
          return res.json({msg: "Goodbye 👋" });
        } else {
          return res.json({msg: "Goodbye 👋" });
        }
        
      } else if (data.status === 0) {
        const birth_day = req.body.birth_day;
        const valid = moment(birth_day, 'YYYY-MM-DD', true).isValid();
        if (valid) {
          const value = { $set: { "birth_day": birth_day, "status": 1 }};
          const response = await collection.updateOne({'_id': data._id}, value);
          console.log(response);
          return res.json({msg: 'Do wants to know how many days till your next birtday?'});
        } else {
          return res.json({msg: 'Birthday format date not valid!'});
        }
      } else if (data.status === -1) {
        const name = req.body.name;
        const value = { $set: { "name": name, "status": 0 }};
        const response = await collection.updateOne({'_id': data._id}, value);
        console.log(response);
        return res.json({msg: 'Whats your birthday?'});
      }
    } else {
      const data = {
        name: '',
        birth_day: '',
        status: -1
      };
      const message = await collection.insertOne(data);

      return res.json({ status: message.insertedId > 0, id: message.insertedId });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({'status': 500, 'msg': 'Internal server error'});
  } finally {
    message.closeDb();
  }
})

module.exports = router;
