const { fakerPT_BR } = require("@faker-js/faker");

describe("Teste de cadastros de filmes", () => {
  let userToken;
  let userId;
  let fixtureDoFilme;
  let movieId;
  let tituloFilme;

  before(() => {
    cy.cadastroLogin().then((resposta) => {
      userToken = resposta.token;
      userId = resposta.id;
      cy.promoverParaAdmin(userToken).then((resposta) => {
        cy.criarFilme(userToken).then((resposta) => {
          movieId = resposta.id;
          tituloFilme = resposta.title;
        });
      });
    });
  });

  after(() => {
    cy.promoverParaAdmin(userToken).then(() => {
      cy.request({
        method: "DELETE",
        url: `/api/movies/${movieId}`,
        headers: {
          Authorization: "Bearer " + userToken,
        },
      });

      cy.request({
        method: "DELETE",
        url: `/api/users/${userId}`,
        auth: {
          bearer: userToken,
        },
      });
    });
  });

  it("Deve adicionar um novo filme  e verificar se ele está na lista ", () => {
    cy.cadastroLogin().then((resposta) => {
      userId = resposta.id;
      userToken = resposta.token;
      cy.request({
        method: "PATCH",
        url: "/api/users/admin",
        headers: {
          Authorization: "Bearer " + userToken,
        },
      }).then((resposta) => {
        cy.fixture("criandoUmFilme.json").then((arquivo) => {
          fixtureDoFilme = arquivo;
          fixtureDoFilme.title = fakerPT_BR.internet.userName();
          cy.request({
            method: "POST",
            url: "/api/movies",
            body: arquivo,
            headers: {
              Authorization: "Bearer " + userToken,
            },
          }).then((resposta) => {
            expect(resposta.status).to.equal(201);
            expect(resposta.body).to.have.property("description");
            expect(resposta.body.description).to.be.equal(
              "O filme da Barbie e do Ken"
            );
            expect(resposta.body.durationInMinutes).to.be.equal(135);
            expect(resposta.body.releaseYear).to.be.equal(2023);
            expect(resposta.body).to.have.property("id");
            expect(resposta.body).to.have.property("title");

            cy.request({
              method: "GET",
              url: "/api/movies",
            }).then((resposta) => {
              resposta.body.forEach(function (item) {
                if (item.title == fixtureDoFilme.title) {
                  expect(item.title).to.equal(fixtureDoFilme.title);
                  movieId = item.id;
                }
              });
            });
          });
        });
      });
    });
  });

  it('Criar um novo filme sem um atributo ("releaseYear")', () => {
    cy.cadastroLogin().then((resposta) => {
      userToken = resposta.token;
      userId = resposta.id;
      cy.promoverParaAdmin(userToken).then((resposta) => {
        cy.request({
          method: "POST",
          url: "/api/movies",
          body: {
            title: "O caminho para El Dourado",
            genre: "Animação",
            description: "qualquer coisa",
            durationInMinutes: 127,
          },
          failOnStatusCode: false,
        }).then((resposta) => {
          expect(resposta.status).to.equal(401);
          expect(resposta.body.error).to.equal("Unauthorized");
          expect(resposta.body.message).to.equal("Access denied.");
        });
      });
    });
  });

  it("Deve conseguir alterar dados do filme", () => {
    cy.request({
      method: "PUT",
      url: `/api/movies/${movieId}`,
      auth: {
        bearer: userToken,
      },
      body: {
        title: "Mudando Titulo1",
        genre: "Mudando Genero1",
        description: "qualquer coisa1",
        durationInMinutes: 10,
        releaseYear: 2024,
      },
    }).then((resposta) => {
      expect(resposta.status).to.equal(204);
    });
  });
});

describe("Testes com usuário comum", () => {
  let movieTitle = fakerPT_BR.internet.userName();
  let movieGenre = fakerPT_BR.internet.password(8);
  let movieDescription = fakerPT_BR.internet.email();
  let userToken;
  let userId;
  let movieId;

  before(() => {
    cy.cadastroLogin().then((resposta) => {
      userToken = resposta.token;
      userId = resposta.id;
    });
  });

  it("Deve receber Forbiden ao criar filme sem ser administrador", () => {
    cy.request({
      method: "POST",
      url: "/api/movies",
      auth: {
        bearer: userToken,
      },
      body: {
        title: movieTitle,
        genre: movieGenre,
        description: movieDescription,
        durationInMinutes: 150,
        releaseYear: 2020,
      },
      failOnStatusCode: false,
    }).then((resposta) => {
      expect(resposta.status).to.equal(403);
      expect(resposta.body.message).to.equal("Forbidden");

      movieId = resposta.body.id;
    });
  });

  // não precisa criar um after, pois não foi criado nenhum filme no banco de dados da API
});