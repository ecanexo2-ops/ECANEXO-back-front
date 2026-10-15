describe('Pruebas de Caja Negra - Pago Reciclador (UI)', () => {

  const roles = [
    { usuario: 'planillero', clave: '1234' },
    { usuario: 'admin', clave: 'admin' },
  ]

  roles.forEach(({ usuario, clave }) => {
    describe(`Rol: ${usuario}`, () => {

      beforeEach(() => {
        cy.login(usuario, clave)
        cy.contains('a.nav-item', 'Pago Reciclador').click()
      })

      it('CP-UI-01: Debe cargar la página de pago a recicladores', () => {
        // SUPUESTO: la ruta contiene "pago". Revisa la real con:
        // grep -n "PagoReciclador" src/App.jsx
        cy.url().should('match', /pago/i)
      })

      it('CP-UI-02: Debe mostrar el título de la pantalla', () => {
        // SUPUESTO: el título usa la clase .section-title (igual que Ventas)
        cy.get('.section-title').should('be.visible')
      })

      it('CP-UI-03: Debe mostrar el subtítulo con el código RF', () => {
        // SUPUESTO: igual que Ventas y Productos, lleva un .section-sub con "RF"
        cy.get('.section-sub').invoke('text').should('match', /RF\d+/)
      })

      it('CP-UI-04: Debe mostrar al menos un card con título', () => {
        cy.get('.card-title').should('have.length.at.least', 1)
      })

      it('CP-UI-05: Debe mostrar un botón de acción para registrar el pago', () => {
        // SUPUESTO: hay un botón con la clase .btn-primary
        cy.get('button.btn-primary').should('be.visible')
      })

    })
  })

})