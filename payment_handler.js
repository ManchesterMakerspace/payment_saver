// payment_handler.js Copyright 2017 ~ Manchester Makerspace ~ MIT License

var mongo = { // depends on: mongoose
    ose: require('mongoose'),
    createModel: function(){
        return new mongo.ose.Schema({                                         // model of what payment documents will look like
            id: mongo.ose.Schema.ObjectId,                                    // we do this for db's primary index
            firstname: {type: String, required: '{PATH} is required'},        // firstname of buyer
            lastname: {type: String, required: '{PATH} is required'},         // lastname of buyer
            email: {type: String, required: '{PATH} is required'},            // email of buyer (not nessiarily member)
            paidFor: {type: String, required: '{PATH} is required'},          // item that was paid for
            amount: {type: Number, required: '{PATH} is required'},           // amount of tender rendered
            dateOfPurchase: {type: Number, required: '{PATH} is required'},   // purchased date, currently not time of membership start
        });
    },
    init: function(db_uri){
        mongo.ose.connect(db_uri);                                            // connect to our database
        var paymentModel = mongo.createModel();                               // create a payment model to use
        mongo.subscription = mongo.ose.model('subscription', paymentModel);   // model for subscription collection
        mongo.rental = mongo.ose.model('rental', paymentModel);               // model for rental payments collection
        mongo.stdMembership = mongo.ose.model('stdMembership', paymentModel); // model for standard membership payments collection
        mongo.classes = mongo.ose.model('classes', paymentModel);             // model for class payments collection
    },
    // basically we have a seperate db for payments that have collections of different types of paypents that are using same model
    saveNewDoc: function(schema, docToSave, errorFunction, successFunction){  // helper method goes through boilerplate save motions
        var docObject = new schema(docToSave);                                // create a new doc (makes an object id basically)
        docObject.save(function saveDocResponse(error){                       // attempt to write doc to db
            if(error){if(errorFunction){errorFunction(error);}}               // given an error function handle error case
            else{if(successFunction){successFunction();}}                     // optional success function
        });
    }
};

var socket = {                                                 // functions for communicating w/ instant payment notification listener
    io: require('socket.io-client'),                           // client side socket.io library this is a client to IPN listener
    init: function(socketServer, authToken){                   // just need to know server to connect to and pass key to start things off
        socket.io = socket.io(socketServer);                   // get socket.io method by connectting to our desired socket server
        socket.io.on('connect', function(){                    // once we have connected to IPN lisner
            socket.io.emit('authenticate', authToken);         // its important lisner know that we are for real
            socket.io.on('payment', socket.handlePayment);     // handle generic payment event
            socket.io.on('rejection', socket.handleRejection); // route to handle auth failure
        });
    },
    IPNevent: function(data){
        // add made payment to data base to either renew or add a pending card holder
    },
    handlePayment: function(payment){
        console.log(JSON.stringify(payment));
    },
    handleRejection: function(reason){ console.log('"'+ reason + '", just cant handle this!');} // happens when auth fails
};


// High level start up sequence
mongo.init(process.env.MONGODB_URI);                                                // conect to our mongo server
socket.init(process.env.PAYMENT_NOTIFICATION_SERVER, process.env.LISTENER_TOKEN); // cennect to IPN listener
