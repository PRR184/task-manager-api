const mongoose = require('mongoose')


const connectionURL = process.env.MONGODB_URL                        
//name of my database is "task-manager-api:

mongoose.connect(connectionURL,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify:false,
})

