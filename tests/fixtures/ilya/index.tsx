<>
    <AuthPage />
    {/* TODO: <Route exact path="auth" component={AuthPage} />
        <Redirect to="/auth" /> */}
</>

// ---------------------------------------------------------------

// !!! FIXME: downgraded, cuz auth-user@^X.X.X causes crashing
/**
 * Логика авторизации
 * @HOC
 * FIXME: Duplicate store (in Redux DevTools)
 */
const withAuth = (Component: Component) => () => ();

// ---------------------------------------------------------------

// FIXME: temp field (before popup)
const SomeField = () => {
    return (
        <div>
            Some JSX
        </div>
    )
}
    
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// ---------------------------------------------------------------