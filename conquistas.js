 const conquistas = [
    { nome: "Primeiro Sangue", meta: 10, tipo: "score", done: false },
    { nome: "Exterminador", meta: 100, tipo: "score", done: false },
    { nome: "Lenda Viva", meta: 500, tipo: "score", done: false },
    { nome: "Sobrevivente", meta: 60, tipo: "tempo", done: false }
];

const box = document.createElement("div");
box.style.position = "absolute";
box.style.bottom = "20px";
box.style.right = "20px";
box.style.color = "#00ff88";

document.body.appendChild(box);

function notify(txt) {
    let div = document.createElement("div");
    div.innerText = "🏆 " + txt;
    div.style.background = "black";
    div.style.padding = "10px";
    div.style.marginTop = "5px";

    box.appendChild(div);

    setTimeout(()=>div.remove(),3000);
}

function check() {
    conquistas.forEach(c => {

        if (c.done) return;

        if (c.tipo === "score" && score >= c.meta) {
            c.done = true;
            notify(c.nome);
        }

        if (c.tipo === "tempo" && tempoVivo >= c.meta) {
            c.done = true;
            notify(c.nome);
        }
    });
}

setInterval(check, 1000);