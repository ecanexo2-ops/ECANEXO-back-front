describe('Pruebas de Caja Negra - Ventas (UI)', () => {

  const roles = [
    { usuario: 'caja', clave: '1234' },
    { usuario: 'admin', clave: 'admin' },
  ]

  roles.forEach(({ usuario, clave }) => {
    describe(`Rol: ${usuario}`, () => {

      beforeEach(() => {
        cy.login(usuario, clave)
        cy.contains('a.nav-item', 'Ventas').click()
      })

      it('CP-UI-01: Debe cargar la página de ventas', () => {
        cy.url().should('include', '/ventas')
      })

      it('CP-UI-02: Debe mostrar el título "Confirmación de ventas"', () => {
        cy.contains('.section-title', 'Confirmación de ventas').should('be.visible')
      })

      it('CP-UI-03: Debe mostrar el formulario "Nueva venta"', () => {
        cy.contains('.card-title', 'Nueva venta').should('be.visible')
        cy.contains('Solicitud').should('be.visible')
        cy.contains('Producto').should('be.visible')
        cy.contains('Cantidad (kg)').should('be.visible')
        cy.contains('Precio acordado').should('be.visible')
        cy.contains('button', 'Confirmar y generar ticket').should('be.visible')
      })

      it('CP-UI-04: Debe mostrar la tabla "Transacciones" con sus columnas', () => {
        cy.contains('.card-title', 'Transacciones').should('be.visible')
        ;['Ticket', 'Cliente', 'Material', 'Total'].forEach(col => {
          cy.contains('th', col).should('be.visible')
        })
      })

      it('CP-UI-05: Debe calcular el total del ticket (cantidad x precio)', () => {
        // SUPUESTO: los inputs numericos son los dos primeros input[type="number"]
        cy.get('input[type="number"]').eq(0).clear().type('50')
        cy.get('input[type="number"]').eq(1).clear().type('350')
        cy.contains('Total ticket').parent().should('contain', '17.500')
      })

      it('CP-UI-06: Debe actualizar el total al cambiar la cantidad', () => {
        cy.get('input[type="number"]').eq(0).clear().type('10')
        cy.get('input[type="number"]').eq(1).clear().type('200')
        cy.contains('Total ticket').parent().should('contain', '2.000')
      })

    })
  })

})