document.addEventListener("DOMContentLoaded", () => {
  loadInitialData();
  document
    .getElementById("itemForm")
    .addEventListener("submit", handleFormSubmit);
  document
    .getElementById("userForm")
    .addEventListener("submit", handleUserSubmit);
});

let usuarios = [];
let itensCadastrados = [];

// Tabs
function openTab(tabId) {
  document
    .querySelectorAll(".tab-content")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".tab")
    .forEach((tab) => tab.classList.remove("bg-white", "shadow"));
  document.getElementById(tabId).classList.add("active");
  event.target.classList.add("bg-white", "shadow");
}

// Carregar dados do backend
async function loadInitialData() {
  try {
    const [usuariosRes, itensRes] = await Promise.all([
      fetch("https://controle-ti-api.onrender.com/api/usuarios"),
      fetch("https://controle-ti-api.onrender.com/api/itens"),
    ]);

    usuarios = await usuariosRes.json();
    itensCadastrados = await itensRes.json();

    updateUserDatalist();
    updateUserList();
    updateReportTable(itensCadastrados);
  } catch (err) {
    alert("Erro ao carregar dados do servidor.");
    console.error(err);
  }
}

// Atualizar datalist e lista de usuários
function updateUserDatalist() {
  const usersDatalist = document.getElementById("users");
  if (!usersDatalist) return;
  usersDatalist.innerHTML = "";
  usuarios.forEach((user) => {
    usersDatalist.innerHTML += `<option value="${user.nome}" data-id="${user._id}">`;
  });
}

function updateUserList() {
  const list = document.getElementById("userList");
  if (!list) return;
  list.innerHTML = "";
  usuarios.forEach((user) => {
    list.innerHTML += `<li>${user.nome} - ${user.setor}</li>`;
  });
}

// Cadastrar novo usuário via API
async function handleUserSubmit(e) {
  e.preventDefault();
  const nome = document.getElementById("userName").value.trim();
  const setor = document.getElementById("userSector").value;
  if (!nome || !setor) return alert("Preencha todos os campos");

  try {
    const res = await fetch("https://controle-ti-api.onrender.com/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, setor }),
    });
    const novoUsuario = await res.json();
    usuarios.push(novoUsuario);
    updateUserDatalist();
    updateUserList();
    e.target.reset();
    alert("Usuário cadastrado com sucesso!");
  } catch (err) {
    alert("Erro ao cadastrar usuário.");
  }
}

// Cadastrar novo item via API
async function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const id = form.dataset.editing;

  const userInput = document.getElementById('itemUser');
  const userOption = document.querySelector(`#users option[value="${userInput.value}"]`);
  const usuarioId = userOption ? userOption.dataset.id : "manual";
  const usuarioNome = userInput.value.trim();

  const formData = {
    nome: document.getElementById('itemName').value,
    tipo: document.getElementById('itemType').value,
    numero_serie: document.getElementById('itemSerial').value,
    setor_id: document.getElementById('itemSector').value,
    usuario_id: usuarioId,
    usuario_nome: usuarioNome,
    data: document.getElementById('itemDate').value,
    observacoes: document.getElementById('itemObs').value,
    status: document.getElementById('itemStatus').value
  };

  try {
    if (id) {
      const res = await fetch(`https://controle-ti-api.onrender.com/api/itens/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const atualizado = await res.json();
      const idx = itensCadastrados.findIndex(i => i._id === id);
      itensCadastrados[idx] = atualizado;
      alert("Item atualizado com sucesso!");
    } else {
      const res = await fetch('https://controle-ti-api.onrender.com/api/itens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const novo = await res.json();
      itensCadastrados.push(novo);
      alert("Item cadastrado com sucesso!");
    }

    updateReportTable(itensCadastrados);
    atualizarDashboard();
    event.target.reset();
    delete form.dataset.editing;
  } catch (err) {
    alert("Erro ao salvar item.");
  }
}


//dashboard
function atualizarDashboard() {
  const total = itensCadastrados.length;
  const emUso = itensCadastrados.filter((i) => i.status === "Em uso").length;
  const disponivel = itensCadastrados.filter(
    (i) => i.status === "Disponível"
  ).length;
  const manutencao = itensCadastrados.filter(
    (i) => i.status === "Manutenção"
  ).length;

  document.getElementById("dashTotalItens").textContent = total;
  document.getElementById("dashEmUso").textContent = emUso;
  document.getElementById("dashDisponivel").textContent = disponivel;
  document.getElementById("dashManutencao").textContent = manutencao;
}

loadInitialData().then(() => atualizarDashboard());

// Atualizar tabela
function updateReportTable(itens) {
  const reportList = document.getElementById("reportList");
  reportList.innerHTML = "";
  itens.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="px-3 py-2 text-sm border-t">${item.nome}</td>
      <td class="px-3 py-2 text-sm border-t">${item.tipo}</td>
      <td class="px-3 py-2 text-sm border-t">${item.numero_serie}</td>
      <td class="px-3 py-2 text-sm border-t">${item.setor_id}</td>
      <td class="px-3 py-2 text-sm border-t">${item.usuario_nome}</td>
      <td class="px-3 py-2 text-sm border-t">${item.data}</td>
      <td class="px-3 py-2 text-sm border-t">${item.status}</td>
      <td class="px-3 py-2 text-sm border-t">${item.observacoes || ""}</td>
       <td>
    <button onclick="editarItem('${
      item._id
    }')" class="text-blue-600 underline">Editar</button>
    <button onclick="excluirItem('${
      item._id
    }')" class="text-red-600 underline ml-2">Excluir</button>
  </td>
    `;
    reportList.appendChild(row);
  });
}

//adicionar e excluir itens
function excluirItem(id) {
  if (!confirm("Tem certeza que deseja excluir este item?")) return;
  fetch(`https://controle-ti-api.onrender.com/api/itens/${id}`, {
    method: "DELETE"
  }).then(() => {
    itensCadastrados = itensCadastrados.filter(i => i._id !== id);
    updateReportTable(itensCadastrados);
    atualizarDashboard();
  }).catch(err => alert("Erro ao excluir item."));
}

function editarItem(id) {
  const item = itensCadastrados.find(i => i._id === id);
  if (!item) return;

  document.getElementById('itemName').value = item.nome;
  document.getElementById('itemType').value = item.tipo;
  document.getElementById('itemSerial').value = item.numero_serie;
  document.getElementById('itemSector').value = item.setor_id;
  document.getElementById('itemUser').value = item.usuario_nome;
  document.getElementById('itemDate').value = item.data;
  document.getElementById('itemObs').value = item.observacoes;
  document.getElementById('itemStatus').value = item.status;

  document.getElementById('itemForm').dataset.editing = id;
}


// Filtro de mês
function generateReport() {
  const selectedMonth = document.getElementById("reportMonth").value;
  const filtered = selectedMonth
    ? itensCadastrados.filter((item) => item.data.startsWith(selectedMonth))
    : itensCadastrados;
  updateReportTable(filtered);
}

// Exportar CSV
function exportToCSV() {
  let csv = "Nome,Tipo,Série,Setor,Usuário,Data,Status\n";
  itensCadastrados.forEach((item) => {
    csv += `${item.nome},${item.tipo},${item.numero_serie},${item.setor_id},${item.usuario_nome},${item.data},${item.status}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "relatorio_itens.csv";
  link.click();
}

