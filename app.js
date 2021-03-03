const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');//autorizacao para a api ser acessada

//envio de emails automaticos
const nodemailer = require('nodemailer');
const SMTP_CONFIG = require('./src/config/smtp');

require('./models/Orcamento');
const Orcamento = mongoose.model('Orcamento');

const app = express();

app.use(express.json());
//permissao de acesso na api
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, Authorization")
    app.use(cors());
    next();
});

mongoose.connect('mongodb://servicoapi:api429837@mongo_servicoapi:27017/servicoapi', {
/*mongoose.connect('mongodb://localhost/os_local', {*/
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Conexão com o BD MongoDB realizado com sucesso!");
}).catch((err) => {
    console.log("Erro: Conexão com o BD MongoDB não realizado com sucesso: " + err);
});

app.post('/orcamento', async (req, res) => {
    const data = req.body
    if (data.phone === '' && data.email === '' && data.whatsApp === '') return res.json({
        error: true,
        message: "Digite um telefone ou email!"
    });

    if (data.email) {
        var transport = nodemailer.createTransport({
            host: SMTP_CONFIG.host,
            port: SMTP_CONFIG.port,
            secure: false,
            auth: {
                user: SMTP_CONFIG.user,
                pass: SMTP_CONFIG.pass,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        var emailHtml = 'Prezado(a),<br><br> Recebi a solicitação de orçamento.<br><br>Em breve será encaminhado o orçamento<br><br>';

        var emailTexto = 'Prezado(a),\n\nRecebi a solicitação de orçamento.\n\nEm breve será encaminhado o orçamento\n\n';

        var emailSendInfo = {
            from: 'rmevendas1@gmail.com',
            to: req.body.email,
            subject: "Recebi a soliticação de orçamento",
            text: emailTexto,
            html: emailHtml,
        }

        await transport.sendMail(emailSendInfo, function (err) {
            console.log('email')
            if (err) return res.status(400).json({
                error: true,
                message: "Erro: Email de orçamento não enviada com sucesso!"
               
            });
        });
    };

    await Orcamento.create(data, (err) => {
        console.log('gravando')
        if (err) return res.status(400).json({
            error: true,
            message: "Erro: Solicitação de orçamento não salvo, tente novamente, mas chegou na api!"
        });
        if (data.email && data.phone || data.email && data.whatsApp) {
            return res.json({
                error: false,
                message: "Registro salvo e um email de confirmação foi enviado, favor conferir, mas entraremos em contato no(s) telefone(s) informado(s)!"
                // não evita que o nodemailer retorne um erro se email não for confirmado recebimento, caso o serviço de envio não seja acessado
            });
        }
        if (data.phone || data.whatsApp)
            return res.json({
                error: false,
                message: "Entraremos em contato no(s) telefone(s) informado(s)!"
            });
        if (data.email)
            return res.json({
                error: false,
                message: "Registro salvo e um email de confirmação foi enviado, favor conferir!"
            });
        
    });

});

/*
app.listen(8080, () => {
    console.log("Servidor iniciado na porta 8080: http://localhost:8080");
})*/

/* uso na web */
var port = process.env.PORT || 3000;
app.listen(port, ()=> {
    console.log('Servidor inicidado na porta ', port,' em http://eletroapi-com-br.umbler.net/ ')
});