// payment_saver.js Copyright 2017 ~ Manchester Makerspace ~ MIT License

var mongo = { // depends on: mongoose
    ose: require('mongoose'),
    createModel: function(){
        var reqMsg = '{PATH} is required';                                    // warning message for required feilds
        return new mongo.ose.Schema({                                         // model of what payment documents will look like
            id: mongo.ose.Schema.ObjectId,                                    // we do this for db's primary index
            product: {type: String, required: reqMsg},                        // item that was paid for
            firstname: {type: String, required: reqMsg},                      // firstname of buyer
            lastname: {type: String, required: reqMsg},                       // lastname of buyer
            amount: {type: Number, required: reqMsg},                         // amount of tender rendered
            currancy: {type: String },                                        // what type of deriro we are talking about
            payment_date: {type: String, required: reqMsg},                   // purchased date, currently not time of membership start
            payer_email: {type: String, required: reqMsg},                    // email of buyer (not nessiarily member)
            address: {type: String},                                          // maybe this is helpfull? its there, we'll take it
            txn_id: {type: String, required: reqMsg},                         // number paypal provides to prevent duplicate transactions
            txn_type: {type: String, required: reqMsg},                       // can indicate failed payments sometimes
            test: {type: Boolean}                                             // was this sent by as simulation or is it real life
        });
    },
    init: function(db_uri){
        mongo.ose.connect(db_uri);                                            // connect to our database
        var paymentSchema = mongo.createModel();                              // create a payment model to use
        mongo.general = mongo.ose.model('general', paymentSchema);            // uncatigorized payments
        mongo.subscription = mongo.ose.model('subscription', paymentSchema);  // model for subscription collection
        mongo.rental = mongo.ose.model('rental', paymentSchema);              // model for rental payments collection
        mongo.stdMembership = mongo.ose.model('stdMembership', paymentSchema);// model for standard membership payments collection
        mongo.classes = mongo.ose.model('classes', paymentSchema);            // model for class payments collection
    },
    // basically we have a seperate db for payments that have collections of different types of paypents that are using same model
    saveNewDoc: function(Model, docToSave, errorFunction, successFunction){   // helper method goes through boilerplate save motions
        var docObject = new Model(docToSave);                                 // create a new doc (varifies and adds an object id basically)
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
            socket.io.emit('authenticate', {token: authToken, name:'Payment Saver'}); // its important lisner know that we are for real
            socket.io.on('payment', socket.handlePay);         // handle generic payment event
        });
    },
    handlePay: function(payment){
        console.log(JSON.stringify(payment));
        mongo.saveNewDoc(mongo.general, payment, socket.payFail, socket.paySuccess);
    },
    payFail: function(error){
        var msg = 'save pay failed:' + error;
        console.log(msg);
        socket.io.emit('slackMsg', msg);
    },
    paySuccess: function(){
        socket.io.emit('slackMsg', 'Payment successfully saved to local database');
    }
};


// High level start up sequence
mongo.init(process.env.MONGODB_URI);                                          // conect to our mongo server
socket.init(process.env.PAYMENT_NOTIFICATION_SERVER, process.env.AUTH_TOKEN); // connect to IPN listener
