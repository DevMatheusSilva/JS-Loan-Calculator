function calculate(){
    // Consegue os elementos do html
    var amount = document.getElementById("amount");
    var apr = document.getElementById("apr");
    var years = document.getElementById("years");
    var payment = document.getElementById("payment");
    var total = document.getElementById("total");
    var totalinterest = document.getElementById("totalinterest");

    // Calcula os valores
    var principal = parseFloat(amount.value);
    var interest = parseFloat(apr.value) / 100 / 12;
    var payments = parseFloat(years.value) * 12;

    // Calcula mais valores
    var x = Math.pow(1 + interest, payments);
    var monthly = (principal * interest * x)/(x-1);

    // Se o resultado for algo finito, ou seja, algo válido ...
    if (isFinite(monthly)) {
        // ... Coloca os valores nos spans
        payment.innerHTML = monthly.toFixed(2);
        total.innerHTML = (monthly*payments).toFixed(2);
        totalinterest.innerHTML = ((monthly*payments)- principal).toFixed(2);
        // Salva os valores do usuário
        save(amount.value, apr.value, years.value);

        // Monta o gráfico
        chart(principal, interest, monthly, payments);
    } else { // Se nao for um valor finito, limpa tudo
        payment.innerHTML = "";
        total.innerHTML = "";
        totalinterest.innerHTML = "";
        chart();
    }

    // Função para armazenar os dados do usuário
    function save (amount, apr, years, zipcopde){
        if (window.localStorage){ // Se o navegador suportar
            localStorage.loan_amount = amount;
            localStorage.loan_apr = apr;
            localStorage.loan_years = years;
        }
    }

    // Cria uma função para carregar os dados assim que o navegador for carregado
    window.onload = function () {
        // Se o navegador suportar, e se existirem valores
        if (window.localStorage && localStorage.loan_amount){
            // Muda o atributo value de cada campo
            document.getElementById("amount").value = localStorage.loan_amount;
            document.getElementById("apr").value = localStorage.loan_apr;
            document.getElementById("years").value = localStorage.loan_years;
        }
    };

    // Função para montar o gráfico
    function chart(principal, interest, monthly, payments){
        var graph = document.getElementById("graph");
        graph.width = graph.width; // Redefinindo o canvas 
        if (arguments.length == 0 || !graph.getContext) return ; // Se nao passarmos nada, ou se o navegador nao suportar

        var g = graph.getContext("2d"); // Todo desenho é feito com esse objeto
        var width = graph.width, height = graph.height; // Obtém o tamanho da tela de desenho

        // Transforma os valores em pixels x
        function paymentToX(n) {return n * width/payments}
        // Transforma os valores em pixels x
        function amountToY(a) {return height-(a * height/(monthly*payments*1.05));}

        // Os pagamentos são uma linha reta de (0,0) a (payments, monthly*payments)
        g.beginPath();
        g.moveTo(paymentToX(0), amountToY(0)) // Começa no canto inferior esquerdo
        g.lineTo(paymentToX(payments), amountToY(monthly.payments)) // Desenha ate o canto superior direito
        g.lineTo(paymentToX(payments), amountToY(0)) // Para baixo, até o canto inferior direito
        g.closePath(); // Volta ao inicio
        g.fillStyle = "#f88" ; // Vermelho - Claro
        g.fill();
        g.font = "bold 12px sans-serif"; // Define uma fonte
        g.fillText("Pagamento de juros", 20,20); // Desenha um texto na legenda

        // O capital acumulado não é linear e é mais complicado de representar no gráfico
        var equity = 0;
        g.beginPath();
        g.moveTo(paymentToX(0), amountToY(0));

        for (var p = 1; p <= payments; p++){
            // Para cada pagamento, descobre quanto é o juro
            var thisMonthsInterest = (principal-equity)*interest;
            equity += (monthly - thisMonthsInterest);
            g.lineTo(paymentToX(p), amountToY(equity)); // Linha ate este ponto
        }

        g.lineTo(paymentToX(payments), amountToY(0)); // Linha de volta para o eixo x
        g.closePath();
        g.fillStyle = "green"; // Agora usa tinta verde
        g.fill(); // E preenche a área sob a curva
        g.fillText("Equidade total", 20,35); // Rotula em verde

        // Faz laço novamente, como acima, mas representa o saldo devedor como uma linha
        // preta grossa no gráfico
        var bal = principal;
        g.beginPath();
        g.moveTo(paymentToX(0),amountToY(bal));
        for(var p = 1; p <= payments; p++) {
            var thisMonthsInterest = bal*interest;
            bal -= (monthly - thisMonthsInterest); // O resto vai para o capital
            g.lineTo(paymentToX(p),amountToY(bal)); // Desenha a linha até esse ponto
        }

        g.lineWidth = 3; // Usa uma linha grossa
        g.stroke(); // Desenha a curva do saldo
        g.fillStyle = "black"; // Troca para texto preto
        g.fillText("Saldo do Empréstimo", 20,50); // Entrada da legenda

        g.textAlign = "center";

        var y = amountToY(0);
        for (var year=1; year*12 <= payments; year++){
            var x = paymentToX(year*12); 
            g.fillRect(x-0.5,y-3,1,3);
            if (year == 1) g.fillText("Ano", x, y-5);
            if (year % 5 == 0 && year*12 !== payments) g.fillText(String(year), x, y-5);
        }

        // Marca valores de pagamento ao longo da margem direita
        g.textAlign = "right";
        g.textBaseline = "middle";
        var ticks = [monthly*payments, principal]; // Os dois pontos que vamos marcar
        var rightEdge = paymentToX(payments); // Coordenada X do eixo Y
        for (var i = 0; i < ticks.length; i++){
            var y = amountToY(ticks[i]); // Calcula a posição y da marca
            g.fillRect(rightEdge-3, y-0.5, 3,1); // Desenha a marcação
            g.fillText(String(ticks[i].toFixed(0)), rightEdge-1, y); // E a rotula.
        }
    }
}