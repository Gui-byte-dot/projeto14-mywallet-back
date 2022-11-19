import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import { v4 as uuidV4 } from "uuid";
import e from 'express';
dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

try{
    await mongoClient.connect();
    db = mongoClient.db("mywallet");
}catch(err){
    console.log(err);
}

app.post("/sign-up", async (req,res) => {
    const {name, email,password} = req.body;

    const passwordHash = bcrypt.hashSync(password, 10);
    await db.collection("users").insertOne({name,email,password:passwordHash});
    res.sendStatus(201);

})
app.post("/sign-in", async (req, res) => {
    const { email, password } = req.body;
    const token = uuidV4();
  
    const user = await db.collection("users").findOne({ email });
    console.log(token);
    console.log(user)
    if (user && bcrypt.compareSync(password, user.password)) {
      await db.collection("sessions").insertOne({
        token,
        userId: user._id,
      });
      res.send({ token });
    } else {
      res.sendStatus(401);
    }
  });
  app.post("/reports", async (req,res) => {
    const {value, description, type} = req.body;
    const { authorization } = req.headers;
    const token = authorization?.replace("Bearer ", "");
    const sessions = await db.collection("sessions").findOne({ token });
    const user = await db.collection("users").findOne({ _id: sessions?.userId });
    const sim = user._id;

   


    if (!token) {
      return res.sendStatus(401);
    }
    try{
        await db.collection('reports').insertOne({
          sim,
          value,
          description,    
          type,
        });
        delete user.password;
        console.log(user._id)
        console.log(sim)
       


        res.sendStatus(201);
    }catch(err){
        res.sendStatus(err);
    }   
});

  app.get("/meus-dados", async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace("Bearer ", "");
    const sessions = await db.collection("sessions").findOne({ token });
    const user = await db.collection("users").findOne({ _id: sessions?.userId });

    if (!token) {
      return res.sendStatus(401);
    }
  
    try {
      delete user.password;
      const infos = await db.collection('reports').find({sim:user._id}).toArray();
      console.log(user);
      res.send(infos);

    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });
  app.listen(5000, () => {
    console.log("Server is listening on port 5000.")
  });






