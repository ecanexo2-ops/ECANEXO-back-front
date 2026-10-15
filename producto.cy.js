describe('Pruebas de Caja Negra - Productos (UI)', () => {

  const roles = [
    { usuario: 'planillero', clave: '1234' },
    { usuario: 'admin', clave: 'admin' },
  ]

  roles.forEach(({ usuario, clave }) => {
    describe(`Rol: ${usuario}`, () => {

      beforeEach(() => {
        cy.login(usuario, clave)
        cy.contains('a.nav-item', 'Registrar productos').click()
      })

      it('CP-UI-01: Debe cargar la página de productos', () => {
        // SUPUESTO: la ruta es /productos (ver App.jsx)
        cy.url().should('include', '/productos')
      })

      it('CP-UI-02: Debe mostrar el subtítulo de la pantalla (RF07)', () => {
        cy.contains('.section-sub', 'RF07').should('be.visible')
        cy.contains('.section-sub', 'Clasificación de materiales').should('be.visible')
      })

      it('CP-UI-03: Debe mostrar el card "Inventario"', () => {
        cy.contains('.card-title', 'Inventario').should('be.visible')
      })

      it('CP-UI-04: Debe mostrar el formulario de registro', () => {
        // SUPUESTO: hay un botón con texto "Registrar"; ajústalo al real
        cy.contains('button', 'Registrar').should('be.visible')
      })

      it('CP-UI-05: La tabla de inventario debe tener filas o encabezados', () => {
        // SUPUESTO: el inventario se muestra en una tabla
        cy.contains('.card-title', 'Inventario')
          .closest('.card')
          .find('table')
          .should('be.visible')
      })

    })
  })

})