const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors');

// middleWare 
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.sc5cufk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollection = client.db('CarHubDB').collection('services');
        const productCollection = client.db('CarHubDB').collection('Products');
        const serviceOrderCollection = client.db('CarHubDB').collection('orderList');

        // jwt area 
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });
            res.send({ token });
        })


        // Product Area

        app.get('/products', async (req, res) => {
            const cursor = productCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // Service Area 

        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, price: 1, service_id: 1, img: 1 },
            };
            const result = await serviceCollection.findOne(query, options);
            res.send(result);
        });

        // Order Handle Area 

        // get specific data by logged in user
        app.get('/orders', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const cursor = serviceOrderCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })


        app.post('/orders', async (req, res) => {
            const singleOrder = req.body;
            const result = await serviceOrderCollection.insertOne(singleOrder);
            res.send(result);
        });

        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const updatedInput = req.body;
            const query = { _id: new ObjectId(id) };
            // const options = { upsert: true }; we should not use upsert true for patch
            const updateOrder = {
                $set: {
                    status: updatedInput.status
                },
            };
            const result = await serviceOrderCollection.updateOne(query, updateOrder);
            res.send(result);
        })

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await serviceOrderCollection.deleteOne(query);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Car Hub Server is Running Here!')
});

app.listen(port, () => {
    console.log(`Car Hub server is running on port ${port}`);
})